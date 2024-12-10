import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { accountType } from 'src/schemas/account.schema';
import { Transaction } from 'src/schemas/transaction.schema';
import { userType } from 'src/schemas/user.schema';
import { TransactionType } from 'src/utils/Constants/transaction.constants';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<Transaction>,
  ) {}

  async sendMoney(
    senderAcc: accountType,
    receiveAcc: accountType,
    amount: any,
  ) {
    senderAcc.Balance -= amount;
    await senderAcc.save();

    receiveAcc.Balance += amount;
    await receiveAcc.save();

    await this.transactionModel.create({
      amount,
      recieverId: receiveAcc.userId,
      senderId: senderAcc.userId,
      type: TransactionType.SEND,
    });

    return {
      message: 'Sended',
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
}
