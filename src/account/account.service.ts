import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Account, accountType } from 'src/schemas/account.schema';
import { userType } from 'src/schemas/user.schema';
import { hashSync, compareSync } from 'bcryptjs';

@Injectable()
export class AccountService {
  constructor(
    @InjectModel(Account.name) private readonly _accountModel: Model<Account>,
  ) {}

  async addAccount(body: any, user: userType) {
    // check if credit card number exist before
    const checkCard = await this._accountModel.findOne({ cardNo: body.cardNo });
    if (checkCard) {
      throw new ConflictException('Card already linked with another account');
    }

    console.log(body.CVV, body.PIN);

    const account = await this._accountModel.create({
      bankId: body.bankId,
      userId: user._id,
      cardNo: body.cardNo,
      date: body.date,
      CVV: hashSync(body.CVV.toString(), 9),
      PIN: hashSync(body.PIN.toString(), 9),
    });

    // if (!user.defaultAcc) {
    //   user.defaultAcc = account._id;
    //   await user.save();
    // }

    return {
      message: 'Account Created',
      account,
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
}
