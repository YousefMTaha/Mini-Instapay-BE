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
import { currentUser } from 'src/decorators/current-user.decorator';
import { AuthGuard } from 'src/guards/auth.guard';
import { userType } from 'src/schemas/user.schema';
import { UserService } from 'src/modules/user/user.service';
import { AccountService } from 'src/modules/account/account.service';
import { accountType } from 'src/schemas/account.schema';
import { EAccountType } from 'src/utils/Constants/system.constants';
import { Types } from 'mongoose';
import { NotificationService } from 'src/modules/notification/notification.service';
import { AuthorizationGuard } from 'src/guards/Authorization.guard';
import { userRoles } from 'src/utils/Constants/user.constants';
import { transactionType } from 'src/schemas/transaction.schema';
import { SendMoneyDTO } from './dto/send-money.dto';

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
  async sendMoney(@currentUser() sender: userType, @Body() body: SendMoneyDTO) {
    let senderAccount: accountType;
    if (body.accountId) {
      senderAccount = await this.accountService.getAccountById(
        sender._id,
        body.accountId,
        EAccountType.OWNER,
      );
    } else {
      senderAccount = await this.accountService.checkDefaultAcc(
        sender,
        EAccountType.OWNER,
      );
    }

    await this.accountService.checkPIN(sender, senderAccount, body.PIN);

    senderAccount.checkAmount(body.amount);
    await this.accountService.checkLimit(body.amount, senderAccount);

    const receiver = await this.userService.findUser({
      data: body.receiverData,
    });

    const receiveAccount = await this.accountService.checkDefaultAcc(
      receiver,
      EAccountType.RECEIVER,
    );

    const transaction = await this.transactionsService.sendMoney(
      senderAccount,
      receiveAccount,
      body.amount,
    );

    return this.notificationService.sendOrReceive(
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
      EAccountType.OWNER,
    );
    return this.transactionsService.changeDefaultAcc(user, account);
  }

  @UseGuards(new AuthorizationGuard(userRoles.User))
  @Post('request-receive-money')
  async reqReceiveMoney(@currentUser() receiver: userType, @Body() body: any) {
    let receiverAcc: accountType;
    if (body.accountId) {
      receiverAcc = await this.accountService.getAccountById(
        receiver._id,
        body.accountId,
        EAccountType.RECEIVER,
      );
    } else {
      receiverAcc = await this.accountService.checkDefaultAcc(
        receiver,
        EAccountType.RECEIVER,
      );
    }

    const sender = await this.userService.findUser({ data: body.receiverData });

    const senderAcc = await this.accountService.checkDefaultAcc(
      sender,
      EAccountType.SENDER,
    );

    const transaction = await this.transactionsService.receiveMoney(
      senderAcc,
      receiverAcc,
      body.amount,
    );

    return this.notificationService.receiveRequest(
      sender,
      receiver,
      transaction._id,
      transaction.amount,
    );
  }

  @UseGuards(new AuthorizationGuard(userRoles.User))
  @Post('confirm-receive/:transactionId')
  async confirmRec(
    @currentUser() sender: userType,
    @Param('transactionId') transactionId: Types.ObjectId,
    @Body() body: any,
  ) {
    const transaction = (await this.transactionsService.getById(
      transactionId,
    )) as transactionType;

    const receiverAcc = (await transaction.populate('accReceiverId'))
      .accReceiverId as accountType;

    this.transactionsService.checkTransactionStatus(transaction);
    await this.transactionsService.checkTransactionOwner(transaction, sender);

    let senderAccount: accountType;
    if (body.accountId) {
      senderAccount = await this.accountService.getAccountById(
        sender._id,
        body.accountId,
        EAccountType.OWNER,
      );
    } else {
      senderAccount = await this.accountService.checkDefaultAcc(
        sender,
        EAccountType.OWNER,
      );
    }

    await this.accountService.checkPIN(sender, senderAccount, body.PIN);

    senderAccount.checkAmount(transaction.amount);
    await this.accountService.checkLimit(transaction.amount, senderAccount);

    const receiver = await this.userService.findUser({
      id: receiverAcc.userId as Types.ObjectId,
    });

    const receiveAccount = await this.accountService.checkDefaultAcc(
      receiver,
      EAccountType.RECEIVER,
    );

    await this.transactionsService.confirmReceive(
      senderAccount,
      receiveAccount,
      transaction,
    );

    return this.notificationService.sendOrReceive(
      sender,
      receiver,
      transaction._id,
      transaction.amount,
    );
  }

  @UseGuards(new AuthorizationGuard(userRoles.User))
  @Post('reject-receive/:transactionId')
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
      transaction.accReceiverId as Types.ObjectId,
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
    return this.transactionsService.getAllTransactions();
  }

  @UseGuards(new AuthorizationGuard(userRoles.Admin))
  @Post('admin/suspiciousTransaction')
  suspiciousTransaction(@Body('transactionId') transactionId: Types.ObjectId) {
    return this.transactionsService.suspiciousTransaction(transactionId);
  }

  @UseGuards(new AuthorizationGuard(userRoles.Admin))
  @Post('admin/approve-refund')
  async approveRefund(@Body('transactionId') transactionId: Types.ObjectId) {
    const transaction = await this.transactionsService.getById(transactionId);

    this.transactionsService.checkForRefund(transaction);

    const receiverAcc = await this.accountService.getAccount(
      transaction.accReceiverId as Types.ObjectId,
    );
    const senderAcc = await this.accountService.getAccount(
      transaction.accSenderId as Types.ObjectId,
    );

    const receiver = (await receiverAcc.populate('userId')).userId as userType;
    const sender = (await senderAcc.populate('userId')).userId as userType;

    await this.notificationService.approveRefund(transaction, sender, receiver);

    return this.transactionsService.approveRefund(
      transaction,
      senderAcc,
      receiverAcc,
    );
  }

  @UseGuards(new AuthorizationGuard(userRoles.Admin))
  @Post('admin/reject-refund')
  async rejectRefund(@Body('transactionId') transactionId: Types.ObjectId) {
    const transaction = await this.transactionsService.getById(transactionId);

    this.transactionsService.checkForRefund(transaction);

    const receiverAcc = await this.accountService.getAccount(
      transaction.accReceiverId as Types.ObjectId,
    );
    const senderAcc = await this.accountService.getAccount(
      transaction.accSenderId as Types.ObjectId,
    );

    const receiver = (await receiverAcc.populate('userId')).userId as userType;
    const sender = (await senderAcc.populate('userId')).userId as userType;

    await this.notificationService.rejectRefund(
      transaction,
      sender._id,
      receiver,
    );

    return this.transactionsService.rejectRefund(transaction);
  }
}
