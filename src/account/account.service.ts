import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Account, accountType } from 'src/schemas/account.schema';
import { userType } from 'src/schemas/user.schema';
import { hashSync, compareSync } from 'bcryptjs';
import { accountErrMsg } from 'src/utils/Constants/system.constants';
import { cardType } from 'src/schemas/card.schema';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TransactionsService } from 'src/transactions/transactions.service';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class AccountService {
  constructor(
    @InjectModel(Account.name) private readonly _accountModel: Model<Account>,
    private readonly transactionService: TransactionsService,
    private readonly JwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
  ) {}

  async getAllAccounts(user: userType) {
    const accounts = await this._accountModel
      .find({ userId: user._id, _id: { $ne: user.defaultAcc } })
      .populate('cardId', 'cardNo')
      .populate('bankId')
      .select('bankId userId');

    if (!accounts.length) throw new NotFoundException('No account exists');

    const data = accounts.map((ele) => {
      return {
        //@ts-ignore
        ...ele._doc,
        //@ts-ignore
        cardNo: ele._doc.cardId.cardNo.substring(ele.cardId.cardNo.length - 4),
        cardId: undefined,
      };
    });

    return {
      message: 'done',
      status: true,
      data,
    };
  }

  async addAccount(body: any, user: userType, card: cardType) {
    const account = await this._accountModel.create({
      bankId: body.bankId,
      cardId: card._id,
      userId: user._id,
      PIN: hashSync(body.PIN.toString(), 9),
      // default: user.defaultAcc ? false : true,
    });

    if (!user.defaultAcc) {
      user.defaultAcc = account._id;
      await user.save();
    }

    return {
      message: 'Account Created',
      status: true,
    };
  }

  async updatePIN(body: any, user: userType, id: string) {
    // check if credit card number exist before
    const checkCard = await this._accountModel.findById(id);
    if (checkCard) {
      throw new ConflictException('Card already linked with another account');
    }

    await this._accountModel.create({
      BankId: body.bankId,
      userId: user._id,
      cardNo: body.cardNo,
      date: body.date,
      CVV: hashSync(body.CVV, 9),
    });

    return {
      message: 'car added',
      status: true,
    };
  }

  async deleteAccount(user: userType, account: accountType) {
    await account.deleteOne();

    if (user.defaultAcc.toString() == account._id.toString()) {
      user.defaultAcc = undefined;
      await user.save();
    }
    return {
      message: 'account deleted',
      status: true,
    };
  }

  async checkPIN(user: userType, account: accountType, PIN: string) {
    if (account.wrongPIN == 4) {
      console.log('send notification');

      await this.notificationService.wrongPIN(account);
    }

    await this.transactionService.checkNoOfTries(account, user);
    if (!compareSync(PIN, account.PIN)) {
      account.wrongPIN++;
      await account.save();
      throw new BadRequestException('invalid PIN');
    }
  }

  async getAccount(id: string): Promise<accountType> {
    const account = await this._accountModel.findById(id);
    if (!account) throw new NotFoundException('account not found');

    return account;
  }

  async checkUserAccount(
    userId: string,
    errorMsg: string,
  ): Promise<accountType> {
    const account = await this._accountModel.findOne({ userId });
    if (!account) throw new NotFoundException(accountErrMsg(errorMsg));
    return account;
  }

  async checkDefaultAcc(
    user: userType,
    errorMsg: string,
  ): Promise<accountType> {
    if (!user.defaultAcc) throw new NotFoundException(accountErrMsg(errorMsg));
    const account = await user.populate('defaultAcc');

    return account.defaultAcc as accountType;
  }

  async getAccountById(
    userId: Types.ObjectId,
    accountId: Types.ObjectId,
    errorMsg: string,
  ) {
    const account = await this._accountModel.findOne({
      userId: userId,
      _id: accountId,
    });
    if (!account) throw new NotFoundException(accountErrMsg(errorMsg));
    return account;
  }

  async getDefault(user: userType) {
    if (!user.defaultAcc)
      throw new NotFoundException(`No default acc yet, Add one account`);
    const data = await user.populate('defaultAcc', ' bankId cardId');

    return data;
  }

  async resetTries(token: string) {
    const { accountId } = this.JwtService.verify(token, {
      secret: this.configService.get<string>('EXCEED_TRYS'),
    });

    const account = await this._accountModel.findByIdAndUpdate(accountId, {
      wrongPIN: 0,
    });
    if (!account) throw new NotFoundException('Invalid account');

    return {
      message: 'done',
      status: true,
    };
  }
}
