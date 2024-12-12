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
      accRecieverId: receiveAcc,
      accSenderId: senderAcc,
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
        $or: [{ accSenderId: user._id }, { accRecieverId: user._id }],
      })
      .sort('createdAt');
    // .populate({ path: 'senderId', select: 'email firstName lastName' })
    // .populate({ path: 'recieverId', select: 'email firstName lastName' });

    if (!transactions.length)
      throw new NotFoundException('No transactions yet');

    return {
      message: 'done',
      data: transactions,
      status: true,
    };
  }

  async receiveMoney(
    senderAcc: accountType,
    recAcc: accountType,
    amount: number,
  ) {
    return await this.transactionModel.create({
      accSenderId: senderAcc,
      accRecieverId: recAcc,
      amount,
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
    transaction.accSenderId = senderAccount._id;
    await transaction.save();
  }

  async rejectReceive(sender: userType, transaction: transactionType) {
    const senderAcc = transaction.accSenderId as accountType;
    if (senderAcc.userId.toString() !== sender._id.toString()) {
      throw new ForbiddenException("You aren't the sender of this transaction");
    }

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

  async checkTransactionOwner(transaction: transactionType, sender: userType) {
    const transactionSenderAcc = (await transaction.populate('accSenderId'))
      .accSenderId as accountType;

    if (transactionSenderAcc.userId.toString() != sender._id.toString()) {
      throw new ForbiddenException("You aren't the sender of this transaction");
    }
  }
}
