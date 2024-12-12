import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { accountType } from 'src/schemas/account.schema';
import { Transaction, transactionType } from 'src/schemas/transaction.schema';
import { userType } from 'src/schemas/user.schema';
import {
  TransactionStatus,
  TransactionType,
} from 'src/utils/Constants/transaction.constants';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<Transaction>,
  ) {}

  async getById(tId: Types.ObjectId) {
    const transaction = await this.transactionModel.findById(tId);
    if (!transaction) {
      throw new NotFoundException('invalid transaction id');
    }
    return transaction;
  }

  async sendMoney(
    senderAcc: accountType,
    receiveAcc: accountType,
    amount: any,
  ) {
    senderAcc.Balance -= amount;
    await senderAcc.save();

    receiveAcc.Balance += amount;
    await receiveAcc.save();

    const transaction = await this.transactionModel.create({
      amount,
      recieverId: receiveAcc.userId,
      senderId: senderAcc.userId,
      type: TransactionType.SEND,
    });

    return transaction;
  }

  async changeDefaultAcc(user: userType, account: accountType) {
    user.defaultAcc = account._id;
    await user.save();
    return {
      message: 'Changed',
      status: true,
    };
  }

  async getHistory(user: userType) {
    const transactions = await this.transactionModel
      .find({
        $or: [{ senderId: user._id }, { recieverId: user._id }],
      })
      .sort('createdAt')
      .populate({ path: 'senderId', select: 'email firstName lastName' })
      .populate({ path: 'recieverId', select: 'email firstName lastName' });

    if (!transactions.length)
      throw new NotFoundException('No transactions yet');

    return {
      message: 'done',
      data: transactions,
      status: true,
    };
  }

  async receiveMoney(senderAcc: accountType, recAcc: accountType, body: any) {
    return await this.transactionModel.create({
      senderId: senderAcc.userId,
      recieverId: recAcc.userId,
      amount: body.amount,
      status: TransactionStatus.BENDING,
      type: TransactionType.RECIEVE,
    });
  }

  async confirmReceive(
    senderAccount: accountType,
    receiverAccount: accountType,
    transaction: transactionType,
  ) {
    senderAccount.Balance -= transaction.amount;
    await senderAccount.save();

    receiverAccount.Balance += transaction.amount;
    await receiverAccount.save();

    transaction.status = TransactionStatus.SUCCESS;
    await transaction.save();
  }

  async rejectReceive(transaction: transactionType) {
    transaction.status = TransactionStatus.FAILED;
    await transaction.save();

    return {
      message: 'done',
      status: true,
    };
  }

  checkTransactionStatus(transaction: transactionType) {
    if (transaction.status != TransactionStatus.BENDING) {
      throw new BadRequestException('This transaction was closed');
    }
  }

  checkTransactionOwner(transaction: transactionType, sender: userType) {
    if (transaction.senderId.toString() != sender._id.toString()) {
      throw new ForbiddenException("You aren't the sender of this transaction");
    }
  }
}
