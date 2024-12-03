import { Injectable } from '@nestjs/common';
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
  }

  
}
