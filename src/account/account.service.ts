import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Account, accountType } from 'src/schemas/account.schema';
import { userType } from 'src/schemas/user.schema';
import { hashSync, compareSync } from 'bcryptjs';
import { accountErrMsg } from 'src/utils/Constants/system.constants';
import { cardType } from 'src/schemas/card.schema';

@Injectable()
export class AccountService {
  constructor(
    @InjectModel(Account.name) private readonly _accountModel: Model<Account>,
  ) {}

  async getAllAccounts(user: userType) {
    const accounts = await this._accountModel
      .find({ userId: user._id })
      .select('cardNo bankId userId');
    if (!accounts.length) throw new NotFoundException('No account exists');

    const data = accounts.map((ele) => {
      return {
        //@ts-ignore
        ...ele._doc,
        //@ts-ignore
        cardNo: ele._doc.cardNo.substring(ele.cardNo.length - 4),
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
    });

    // if (!user.defaultAcc) {
    //   user.defaultAcc = account._id;
    //   await user.save();
    // }

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

  async deleteAccount(account: accountType) {
    await account.deleteOne();

    return {
      message: 'account deleted',
      status: true,
    };
  }

  checkPIN(account: accountType, PIN: string): void {
    if (!compareSync(PIN, account.PIN)) {
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
}
