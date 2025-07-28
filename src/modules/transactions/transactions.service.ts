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
import { authForOptions, authTypes } from 'src/utils/Constants/user.constants';
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
      accReceiverId: receiveAcc,
      accSenderId: senderAcc,
      type: TransactionType.SEND,
    });

    return transaction;
  }

  async checkNoOfTries(account: accountType, user: userType) {
    if (!account.checkNoOfTries()) {
      const emailToken = this.JwtService.sign(
        { accountId: account._id },
        { secret: this.configService.get<string>('EXCEED_TRIES') },
      );
      let send = true;
      let sendBefore = false;
      for (const type of user.authTypes) {
        if (
          type.authFor === authForOptions.INVALID_PIN &&
          type.type === authTypes.TOKEN
        ) {
          sendBefore = true;

          if (type.expireAt > new Date()) {
            send = false;
          } else {
            const nowDate = new Date();
            type.expireAt = new Date(
              nowDate.setMinutes(nowDate.getMinutes() + 10),
            );
            await user.save();
          }
          break;
        }
      }

      if (!sendBefore) {
        user.authTypes.push({
          authFor: authForOptions.INVALID_PIN,
          type: authTypes.TOKEN,
          value: emailToken,
        });
        await user.save();
      }

      if (send) await this.sendToken(emailToken, user.email);

      throw new BadRequestException(
        'You entered the wrong PIN too many times, To continue trying, Check your email that linked with this account',
      );
    }
  }

  async sendToken(emailToken: string, email: string) {
    const url = `http://localhost:3000/account/verifyAccountUser/${emailToken}`;
    await this.mailService.sendEmail({
      to: email,
      subject: 'Reset PIN tries',
      html: `
      <h1> You entered PIN wrong many times on instapay </h1>
      <h2> we want to ensure that the account owner was trying.</h2>
      to continue to try enter the PIN <a href='${url}'> click this link </a>  
        `,
    });
    return {
      message: 'done',
      status: true,
    };
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
          localField: 'accReceiverId',
          foreignField: '_id',
          as: 'accReceiverId',
        },
      },
      { $unwind: '$accReceiverId' },
      {
        $lookup: {
          from: 'users',
          foreignField: '_id',
          localField: 'accReceiverId.userId',
          as: 'receiver',
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
      { $unwind: '$receiver' },
      {
        $project: {
          accSenderId: 0,
          accReceiverId: 0,
        },
      },
      {
        $match: {
          $or: [{ 'sender._id': user._id }, { 'receiver._id': user._id }],
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
      accReceiverId: recAcc,
      amount,
      status: TransactionStatus.PENDING,
      type: TransactionType.RECEIVE,
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
    if (transaction.status != TransactionStatus.PENDING) {
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

  async getAllTransactions() {
    return await this.transactionModel.aggregate([
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
          localField: 'accReceiverId',
          foreignField: '_id',
          as: 'accReceiverId',
        },
      },
      { $unwind: '$accReceiverId' },
      {
        $lookup: {
          from: 'users',
          foreignField: '_id',
          localField: 'accReceiverId.userId',
          as: 'receiver',
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
      { $unwind: '$receiver' },
      {
        $project: {
          accSenderId: 0,
          accReceiverId: 0,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);
  }

  async suspiciousTransaction(transactionId: Types.ObjectId) {
    const transaction = await this.transactionModel
      .findById(transactionId)
      .populate({
        path: 'accSenderId',
        populate: {
          path: 'userId',
        },
      })
      .populate({
        path: 'accReceiverId',
        populate: {
          path: 'userId',
        },
      });

    if (!transaction) throw new NotFoundException('invalid transaction id');
    if (transaction.status == TransactionStatus.SUSPICIOUS)
      throw new BadRequestException('transaction already reported before');
    const senderAccount = transaction.accSenderId as accountType;
    const sender = senderAccount.userId as userType;

    const receiverAccount = transaction.accReceiverId as accountType;
    const receiver = receiverAccount.userId as userType;

    await this.mailService.sendEmail({
      to: sender.email,
      subject: 'Suspicious Transaction',
      html: `
      <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Report - Suspicious Transaction</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f7fc;
            margin: 0;
            padding: 0;
        }
        .container {
            width: 80%;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin-top: 50px;
        }
        .header {
            text-align: center;
            font-size: 24px;
            color: #333;
            margin-bottom: 20px;
        }
        .report-content {
            font-size: 16px;
            color: #555;
        }
        .report-content p {
            margin: 10px 0;
        }
        .highlight {
            font-weight: bold;
            color: #d9534f;
        }
        .info {
            font-weight: bold;
        }
        .footer {
            text-align: center;
            font-size: 14px;
            color: #aaa;
            margin-top: 20px;
        }
    </style>
</head>
<body>

    <div class="container">
        <div class="header">
            <h1>ADMIN REPORT</h1>
        </div>
        
        <div class="report-content">
            <p>Your transaction with this information was reported as <span class="highlight">suspicious</span>:</p>
            <p><span class="info">Send to:</span> ${receiver.email}</p>
            <p><span class="info">Amount:</span> ${transaction.amount} EGP</p>
            <p><span class="info">Send time:</span> ${transaction.createdAt}</p>
        </div>
        
        <div class="footer">
            <p>&copy; 2024 Admin Report System</p>
        </div>
    </div>

</body>
</html>
      `,
    });

    transaction.status = TransactionStatus.SUSPICIOUS;
    await transaction.save();

    return {
      message: 'Reported',
      status: true,
    };
  }

  async requestRefund(transaction: transactionType) {
    transaction.status = TransactionStatus.REFUNDING;
    await transaction.save();
    return {
      message: 'Waiting for admin to approve',
      status: true,
    };
  }

  checkForRefund(transaction: transactionType, loginUser?: boolean) {
    if (loginUser) {
      if (transaction.status == TransactionStatus.REFUNDING)
        throw new BadRequestException(
          'You already request to refund, wait for admin to approve',
        );
      if (transaction.status == TransactionStatus.REFUNDED)
        throw new BadRequestException(
          'This transaction already refunded before',
        );
    } else {
      if (transaction.status != TransactionStatus.REFUNDING) {
        throw new BadRequestException('Transaction already solved before');
      }
    }
  }

  async approveRefund(
    transaction: transactionType,
    senderAcc: accountType,
    receiverAcc: accountType,
  ) {
    senderAcc.Balance += transaction.amount;
    await senderAcc.save();

    receiverAcc.Balance -= transaction.amount;
    await receiverAcc.save();

    transaction.status = TransactionStatus.REFUNDED;
    await transaction.save();
    return {
      message: 'Refunded',
      status: true,
    };
  }

  async rejectRefund(transaction: transactionType) {
    transaction.status = TransactionStatus.SUCCESS;
    await transaction.save();

    return {
      message: 'Rejected',
      status: true,
    };
  }
}
