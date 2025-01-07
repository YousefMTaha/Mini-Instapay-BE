import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Account, accountType } from 'src/schemas/account.schema';
import { userType } from 'src/schemas/user.schema';
import { hashSync, compareSync } from 'bcryptjs';
import {
  accountErrMsg,
  EaccountType,
} from 'src/utils/Constants/system.constants';
import { cardType } from 'src/schemas/card.schema';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TransactionsService } from 'src/modules/transactions/transactions.service';
import { NotificationService } from 'src/modules/notification/notification.service';
import {
  limitType,
  ONE_DAY_MILLI,
  ONE_WEEK_MILLI,
} from 'src/utils/Constants/account.constanta';
import { customAlphabet } from 'nanoid';
import { authForOptions, authTypes } from 'src/utils/Constants/user.constants';
import { AuthService } from '../auth/auth.service';
import { MailService } from 'src/utils/email.service';
import { UpdateLimitDTO } from './dto/update-amount.dto';

@Injectable()
export class AccountService {
  constructor(
    @InjectModel(Account.name) private readonly _accountModel: Model<Account>,
    private readonly transactionService: TransactionsService,
    private readonly JwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
    private readonly authService: AuthService,
    private readonly mailService: MailService,
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

  async updatePIN(body: any, account: accountType) {
    account.PIN = hashSync(body.newPIN, 10);
    await account.save();

    return {
      message: 'PIN updated',
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
      await this.notificationService.wrongPIN(account);
    }

    await this.transactionService.checkNoOfTries(account, user);
    if (!compareSync(PIN, account.PIN)) {
      account.wrongPIN++;
      await account.save();
      throw new BadRequestException('invalid PIN');
    }
  }

  async getAccount(id: Types.ObjectId): Promise<accountType> {
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

  async checkLimit(amount: number, account: accountType) {
    const remainLimit = account.limit.amount - account.limit.spent;
    if (remainLimit < amount) {
      await this.notificationService.exceedLimit(
        amount,
        account.userId as Types.ObjectId,
      );

      throw new BadRequestException(
        `You will exceed the ${account.limit.type} limit. You only have ${remainLimit} EGP to spend`,
      );
    }
  }

  async updateLimit(account: accountType, body: UpdateLimitDTO) {
    const { amount, type } = body;

    const endDate =
      type == limitType.DAILY
        ? Date.now() + ONE_DAY_MILLI
        : Date.now() + ONE_WEEK_MILLI;

    await account.updateOne({
      'limit.amount': amount,
      'limit.spent': 0,
      'limit.type': type,
      'limit.endDate': endDate,
    });

    return {
      message: 'Updated',
      status: true,
    };
  }

  async forgetOTPMail(user: userType, account: accountType) {
    const generateOTP = customAlphabet('0123456789', 6);

    const OTP = generateOTP();

    const userType = user.authTypes.find(
      (ele) =>
        ele.authFor == authForOptions.FORGET_PIN && ele.type === authTypes.CODE,
    );

    if (!userType) {
      user.authTypes.push({
        type: authTypes.CODE,
        authFor: authForOptions.FORGET_PIN,
        value: hashSync(OTP, 9),
      });
    } else {
      this.authService.checkForSendOTPDuration(userType.expireAt);
      userType.value = hashSync(OTP, 9);
      userType.expireAt = new Date().setMinutes(
        new Date().getMinutes() + 10,
      ) as unknown as Date;
    }

    await this.mailService.sendEmail({
      to: user.email,
      subject: 'Forget PIN',
      html: `
                <h1> This is your OTP for Forget PIN, The OTP valid for 10 mintues</h1>
                <h2> ${OTP} </h2>
                `,
    });

    const token = this.JwtService.sign(
      { _id: user._id, accountId: account._id },
      { secret: this.configService.get<string>('TOKEN_FORGET_PIN') },
    );

    await user.save();

    return {
      message: 'Email Sended',
      status: true,
      token,
    };
  }

  async confirmOTPForgetPIN(token: string, user: userType, otp: string) {
    const { accountId } = this.JwtService.verify(token, {
      secret: this.configService.get<string>('TOKEN_FORGET_PIN'),
    });

    for (let type of user.authTypes) {
      if (
        type.authFor === authForOptions.FORGET_PIN &&
        type.type === authTypes.CODE
      ) {
        if (!compareSync(otp.toString(), type.value || '1'))
          throw new BadRequestException('Invalid OTP');

        if (type.expireAt < new Date())
          throw new BadRequestException('OTP Expired');

        type.value = undefined;
        break;
      }
    }

    const resToken = this.JwtService.sign(
      { accountId: accountId },
      { secret: this.configService.get<string>('TOKEN_CONFIRM_OTP_FORGET') },
    );

    return {
      message: 'Done',
      status: true,
      token: resToken,
    };
  }

  async forgetPIN(user: userType, token: string, PIN: string) {
    const { accountId } = this.JwtService.verify(token, {
      secret: this.configService.get<string>('TOKEN_CONFIRM_OTP_FORGET'),
    });

    const account = await this.getAccountById(
      user._id,
      accountId,
      EaccountType.OWNER,
    );

    await account.updateOne({ PIN: hashSync(PIN, 10) });

    return {
      message: 'updated',
      status: true,
    };
  }
}
