import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { currentUser } from 'src/decorators/current-user.decortaor';
import { UnHandledExceptions } from 'src/filters/unhandeldErrors.filter';
import { AuthGuard } from 'src/guards/auth.guard';
import { userType } from 'src/schemas/user.schema';
import { UserService } from 'src/user/user.service';
import { AccountService } from 'src/account/account.service';
import { accountType } from 'src/schemas/account.schema';
import { EaccountType } from 'src/utils/Constants/system.constants';
import { Types } from 'mongoose';
import { NotificationService } from 'src/notification/notification.service';

// useFilte(UnHandledExceptions)
@UseGuards(AuthGuard)
@Controller('transaction')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly accountService: AccountService,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
  ) {}

  @Post('/send-money')
  async sendMoney(@currentUser() sender: userType, @Body() body: any) {
    let senderAccount: accountType;
    if (body.accountId) {
      senderAccount = await this.accountService.getAccountById(
        sender._id,
        body.accountId,
        EaccountType.OWNER,
      );
    } else {
      senderAccount = await this.accountService.checkDefaultAcc(
        sender,
        EaccountType.OWNER,
      );
    }

    await this.accountService.checkPIN(sender, senderAccount, body.PIN);

    senderAccount.checkAmount(body.amount);

    const receiver = await this.userService.findUser({
      data: body.receiverData,
    });

    const receiveAccount = await this.accountService.checkDefaultAcc(
      receiver,
      EaccountType.RECEIVER,
    );

    const transaction = await this.transactionsService.sendMoney(
      senderAccount,
      receiveAccount,
      body.amount,
    );

    return this.notificationService.sendOrRecieve(
      sender,
      receiver,
      transaction._id,
      transaction.amount,
    );
  }

  @Get('history')
  getHistory(@currentUser() user: userType) {
    return this.transactionsService.getHistory(user);
  }

  @Patch('change-default')
  async changeDefault(
    @currentUser() user: userType,
    @Body('accountId') accountId: Types.ObjectId,
  ) {
    if (user.defaultAcc.toString() == accountId.toString()) {
      throw new BadRequestException("It's already the default account");
    }
    const account = await this.accountService.getAccountById(
      user._id,
      accountId,
      EaccountType.OWNER,
    );
    return this.transactionsService.changeDefaultAcc(user, account);
  }

  @Post('request-recieve-money')
  async reqRecieveMoney(@currentUser() reciever: userType, @Body() body: any) {
    let recieverAcc: accountType;
    if (body.accountId) {
      recieverAcc = await this.accountService.getAccountById(
        reciever._id,
        body.accountId,
        EaccountType.RECEIVER,
      );
    } else {
      recieverAcc = await this.accountService.checkDefaultAcc(
        reciever,
        EaccountType.RECEIVER,
      );
    }

    const sender = await this.userService.findUser({ data: body.reciverData });

    const senderAcc = await this.accountService.checkDefaultAcc(
      sender,
      EaccountType.SENDER,
    );

    const transaction = await this.transactionsService.receiveMoney(
      senderAcc,
      recieverAcc,
      body.amount,
    );

    return this.notificationService.recieveRequest(
      sender,
      reciever,
      transaction._id,
      transaction.amount,
    );
  }

  @Post('confirm-recieve/:transactionId')
  async confirmRec(
    @currentUser() sender: userType,
    @Param('transactionId') transactionId: Types.ObjectId,
    @Body() body: any,
  ) {
    const transaction = await this.transactionsService.getById(transactionId);

    const receiverAcc = (await transaction.populate('accRecieverId'))
      .accRecieverId as accountType;

    this.transactionsService.checkTransactionStatus(transaction);
    await this.transactionsService.checkTransactionOwner(transaction, sender);

    let senderAccount: accountType;
    if (body.accountId) {
      senderAccount = await this.accountService.getAccountById(
        sender._id,
        body.accountId,
        EaccountType.OWNER,
      );
    } else {
      senderAccount = await this.accountService.checkDefaultAcc(
        sender,
        EaccountType.OWNER,
      );
    }

    await this.accountService.checkPIN(sender, senderAccount, body.PIN);

    senderAccount.checkAmount(transaction.amount);

    const receiver = await this.userService.findUser({
      id: receiverAcc.userId,
    });

    const receiveAccount = await this.accountService.checkDefaultAcc(
      receiver,
      EaccountType.RECEIVER,
    );

    await this.transactionsService.confirmReceive(
      senderAccount,
      receiveAccount,
      transaction,
    );

    return this.notificationService.sendOrRecieve(
      sender,
      receiver,
      transaction._id,
      transaction.amount,
    );
  }

  @Post('reject-recieve/:transactionId')
  async rejectRec(
    @currentUser() sender: userType,
    @Param('transactionId') transactionId: Types.ObjectId,
  ) {
    const transaction = await (
      await this.transactionsService.getById(transactionId)
    ).populate('accSenderId');

    this.transactionsService.checkTransactionStatus(transaction);

    await this.transactionsService.rejectReceive(sender, transaction);

    return this.notificationService.rejectSend(
      sender.email,
      transaction.accRecieverId as Types.ObjectId,
      transaction._id,
    );
  }
}
