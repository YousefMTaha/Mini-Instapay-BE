import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { accountType } from 'src/schemas/account.schema';
import { Transaction, transactionType } from 'src/schemas/transaction.schema';
import { userType } from 'src/schemas/user.schema';
import {
  TransactionStatus,
  TransactionType,
} from 'src/utils/Constants/transaction.constants';
import { MailService } from 'src/utils/email.service';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<Transaction>,
    private readonly JwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
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

  async checkNoOfTries(account: accountType, user: userType) {
    if (account.checkNoOfTries()) {
      const emailToken = this.JwtService.sign(
        { accountId: account._id },
        { secret: this.configService.get<string>('EXCEED_TRYS') },
      );

      const url = `http://localhost:3000/transaction/verifyAccountUser/${emailToken}`;
      await this.mailService.sendEmail({
        to: user.email,
        subject: 'Reset PIN trys',
        html: `
        <h1> You entered PIN wrong many times on instapay </h1>
        <h2> we want to ensure that the owner account who was trying.</h2>
        to continue to try enter the PIN <a href='${url}'> click this link </a>  
          `,
      });

      throw new BadRequestException(
        'You enterd the wrong PIN too many times, To continue trying, Check your email that linked with this account',
      );
    }
  }

  async resetTries(token: string) {
    const { accountId } = this.JwtService.verify(token, {
      secret: this.configService.get<string>('EXCEED_TRYS'),
    });

    const account = await this.transactionModel.findById(accountId);
    if (!account) throw new NotFoundException('invalid accountId');

    // const 
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
    const transactions = await this.transactionModel.aggregate([
      {
        $lookup: {
          from: 'accounts',
          localField: 'accSenderId',
          foreignField: '_id',
          as: 'accSenderId',
        },
      },
      { $unwind: '$accSenderId' },
      {
        $lookup: {
          from: 'users',
          foreignField: '_id',
          localField: 'accSenderId.userId',
          as: 'sender',
          pipeline: [
            {
              $project: {
                firstName: 1,
                lastName: 1,
                email: 1,
                userName: { $concat: ['$firstName', ' ', '$lastName'] },
                _id: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'accounts',
          localField: 'accRecieverId',
          foreignField: '_id',
          as: 'accRecieverId',
        },
      },
      { $unwind: '$accRecieverId' },
      {
        $lookup: {
          from: 'users',
          foreignField: '_id',
          localField: 'accRecieverId.userId',
          as: 'reciever',
          pipeline: [
            {
              $project: {
                firstName: 1,
                lastName: 1,
                email: 1,
                userName: { $concat: ['$firstName', ' ', '$lastName'] },
                _id: 1,
              },
            },
          ],
        },
      },
      { $unwind: '$sender' },
      { $unwind: '$reciever' },
      {
        $project: {
          accSenderId: 0,
          accRecieverId: 0,
        },
      },
      {
        $match: {
          $or: [{ 'sender._id': user._id }, { 'reciever._id': user._id }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

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
