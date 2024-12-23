import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { currentUser } from 'src/decorators/current-user.decortaor';
import { AuthGuard } from 'src/guards/auth.guard';
import { userType } from 'src/schemas/user.schema';
import { UserService } from 'src/modules/user/user.service';
import { AccountService } from 'src/modules/account/account.service';
import { accountType } from 'src/schemas/account.schema';
import { EaccountType } from 'src/utils/Constants/system.constants';
import { Types } from 'mongoose';
import { NotificationService } from 'src/modules/notification/notification.service';
import { AuthorizationGuard } from 'src/guards/Authorization.guard';
import { userRoles } from 'src/utils/Constants/user.constants';
import { transactionType } from 'src/schemas/transaction.schema';

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

  @UseGuards(new AuthorizationGuard(userRoles.User))
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

  @UseGuards(new AuthorizationGuard(userRoles.User))
  @Get('history')
  getHistory(@currentUser() user: userType) {
    return this.transactionsService.getHistory(user);
  }

  @UseGuards(new AuthorizationGuard(userRoles.User))
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

  @UseGuards(new AuthorizationGuard(userRoles.User))
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

  @UseGuards(new AuthorizationGuard(userRoles.User))
  @Post('confirm-recieve/:transactionId')
  async confirmRec(
    @currentUser() sender: userType,
    @Param('transactionId') transactionId: Types.ObjectId,
    @Body() body: any,
  ) {
    const transaction = (await this.transactionsService.getById(
      transactionId,
    )) as transactionType;

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
      id: receiverAcc.userId as Types.ObjectId,
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

  @UseGuards(new AuthorizationGuard(userRoles.User))
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

  @UseGuards(new AuthorizationGuard(userRoles.User))
  @Post('request-refund')
  async requestRefund(@currentUser() user: userType, @Body() data: any) {
    const { transactionId, reason } = data;
    const transaction = await this.transactionsService.getById(transactionId);

    await this.transactionsService.checkTransactionOwner(transaction, user);
    this.transactionsService.checkForRefund(transaction, true);

    const admins = await this.userService.getAllAdmins();

    await this.notificationService.requestRefund(
      user,
      transaction,
      reason,
      admins,
    );

    return this.transactionsService.requestRefund(transaction);
  }

  // Admin
  @UseGuards(new AuthorizationGuard(userRoles.Admin))
  @Get('admin')
  getAllTransactions() {
    return this.transactionsService.getAllTransacions();
  }

  @UseGuards(new AuthorizationGuard(userRoles.Admin))
  @Post('admin/suspiciousTransaction')
  suspiciousTransaction(@Body('transactionId') transactionId: Types.ObjectId) {
    return this.transactionsService.suspiciousTransaction(transactionId);
  }

  @UseGuards(new AuthorizationGuard(userRoles.Admin))
  @Post('admin/approve-refund')
  async approveRefund(@Body('transactionId') transationId: Types.ObjectId) {
    const transaction = await this.transactionsService.getById(transationId);

    this.transactionsService.checkForRefund(transaction);

    const recieverAcc = await this.accountService.getAccount(
      transaction.accRecieverId as Types.ObjectId,
    );
    const senderAcc = await this.accountService.getAccount(
      transaction.accSenderId as Types.ObjectId,
    );

    const reciever = (await recieverAcc.populate('userId')).userId as userType;
    const sender = (await senderAcc.populate('userId')).userId as userType;

    await this.notificationService.approveRefund(transaction, sender, reciever);

    return this.transactionsService.approveRefund(
      transaction,
      senderAcc,
      recieverAcc,
    );
  }

  @UseGuards(new AuthorizationGuard(userRoles.Admin))
  @Post('admin/reject-refund')
  async rejectRefund(@Body('transactionId') transationId: Types.ObjectId) {
    const transaction = await this.transactionsService.getById(transationId);

    this.transactionsService.checkForRefund(transaction);

    const recieverAcc = await this.accountService.getAccount(
      transaction.accRecieverId as Types.ObjectId,
    );
    const senderAcc = await this.accountService.getAccount(
      transaction.accSenderId as Types.ObjectId,
    );

    const reciever = (await recieverAcc.populate('userId')).userId as userType;
    const sender = (await senderAcc.populate('userId')).userId as userType;

    await this.notificationService.rejectRefund(
      transaction,
      sender._id,
      reciever,
    );

    return this.transactionsService.rejectRefund(transaction);
  }
}
