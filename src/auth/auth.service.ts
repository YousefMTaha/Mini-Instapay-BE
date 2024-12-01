import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, userType } from 'src/schemas/user.schema';
import { hashSync, compareSync } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from 'src/utils/email.service';
import {
  authForOptions,
  authTypes,
  userstatus,
} from 'src/utils/Constants/user.constants';
import { customAlphabet } from 'nanoid';
@Injectable()
export class AuthService {
  private generateOTP = customAlphabet('0123456789', 6);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private mailService: MailService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async singup(body: any) {
    const { email, mobileNumber } = body;

    const isEmail = await this.userModel.findOne({ email });
    if (isEmail) throw new ConflictException('email is already exist');

    const isPhone = await this.userModel.findOne({ mobileNumber });
    if (isPhone) throw new ConflictException('phone is already exist');

    const hashedPassword = hashSync(body.password, 10);

    const OTP = this.generateOTP();

    await this.mailService.sendEmail({
      to: email,
      subject: 'Confirm Email',
      html: `<h1> This is your OTP for confirmation, The OTP valid for 10 mintues</h1>
          <h2> ${OTP} </h2>
        `,
    });

    body.authTypes = [
      {
        type: authTypes.CODE,
        authFor: authForOptions.SIGNUP,
        value: hashSync(OTP, 9),
      },
    ];

    body.password = hashedPassword;
    const user = await this.userModel.create(body);

    user.authTypes = undefined;
    user.password = undefined;

    const token = this.jwtService.sign(
      { _id: user._id },
      { secret: this.configService.get<string>('TOKEN_SIGNUP') },
    );

    return {
      message: 'done',
      user,
      token,
      status: true,
    };
  }

  async verifyEmail(token: string, otp: string) {
    const { _id } = this.jwtService.verify(token, {
      secret: this.configService.get<string>('TOKEN_SIGNUP'),
    });
    const user = await this.userModel.findById(_id);
    if (!user) throw new NotFoundException('Invalid token, Signup');

    if (user.confirmEmail)
      throw new BadRequestException('email is already confirmed');

    for (let value of user.authTypes) {
      if (
        value.authFor === authForOptions.SIGNUP &&
        value.type === authTypes.CODE
      ) {
        if (!compareSync(otp.toString(), value.value || '1'))
          throw new BadRequestException('Invalid OTP');

        if (value.expireAt < Date.now())
          throw new BadRequestException('OTP Expired');

        value.value = undefined;

        break;
      }
    }

    user.confirmEmail = true;
    await user.save();

    return { message: 'Email confirmed', status: true };
  }

  // async verifyOTP(type: authForOptions, token: string, otp: string) {
  //   const { _id } = this.jwtService.verify(token, {
  //     secret: this.configService.get<string>(`TOKEN_${type}`),
  //   });

  //   const user = await this.userModel.findById(_id);
  //   if (!user) throw new NotFoundException('Invalid email, Signup');

  //   for (let value of user.authTypes) {
  //     if (
  //       value.authFor === authForOptions[type] &&
  //       value.type === authTypes.CODE
  //     ) {
  //       if (!compareSync(otp, value.value))
  //         throw new BadRequestException('Invalid OTP');

  //       if (value.expireAt < Date.now())
  //         throw new BadRequestException('OTP Expired');

  //       value = undefined;

  //       break;
  //     }
  //   }

  //   return { message: 'OTP confirmed', status: true };
  // }

  // private async getTokenSignature(type: authForOptions) {
  //   authForOptions.FORGET_PASSWORD;
  //   authForOptions.LOGIN;
  //   authForOptions.SIGNUP;
  //   authForOptions.TRANSACTION;
  //   switch (type) {
  //     case authForOptions.FORGET_PASSWORD:
  //       return 'TOKEN_FORGET_PASSWORD';
  //     case authForOptions.LOGIN:
  //       return 'TOKEN_LOGIN';
  //     case authForOptions.SIGNUP:
  //       return 'TOKEN_SIGNUP';
  //     case authForOptions.TRANSACTION:
  //       return 'TOKEN_TRANSACTION';
  //     case authForOptions.PRE_LOGIN:
  //       return;
  //   }
  // }

  private checkForSendOTPDuration(time: number) {
    const nowDateInMill = Date.now();
    const expireAtInMill = time;

    if (nowDateInMill < expireAtInMill) {
      throw new HttpException(
        `You can't ask for another OTP as there's already a valid one, you can try after ${((expireAtInMill - nowDateInMill) / (60 * 1000)).toFixed(2)} m `,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async resendOTP(type: authForOptions, token: string) {
    const { _id } = this.jwtService.verify(token, {
      secret: this.configService.get<string>(`TOKEN_${type}`),
    });

    const user = await this.userModel.findById(_id);
    if (!user) throw new NotFoundException('invalid email , signup first');

    if (user.confirmEmail && type == authForOptions.SIGNUP)
      throw new ConflictException('email is already confirmed');

    for (const value of user.authTypes) {
      if (
        value.authFor === authForOptions[type] &&
        value.type === authTypes.CODE
      ) {
        this.checkForSendOTPDuration(value.expireAt);

        const OTP = this.generateOTP();
        await this.mailService.sendEmail({
          to: user.email,
          subject: `resend OTP for ${type}`,
          html: `<h1> This is your OTP for ${type}, The OTP valid for 10 mintues</h1>
                <h2> ${OTP} </h2>
              `,
        });

        value.value = hashSync(OTP, 9);
        value.expireAt = Date.now() + 10 * 60 * 1000;

        await user.save();

        return {
          message: 'Email sended',
          status: true,
        };
      }
    }
  }

  async prelogin(body: any) {
    const { email, password } = body;

    const user = await this.userModel.findOne({ email });

    if (!user || !compareSync(password, user.password)) {
      throw new BadRequestException('invalid info');
    }

    if (!user.confirmEmail)
      throw new BadRequestException('confirm your email first');

    if (user.status == userstatus.Suspended) {
      throw new ForbiddenException(
        'Your account has been banned, please contact us',
      );
    }

    const OTP = this.generateOTP();

    const userType = user.authTypes.find(
      (ele) =>
        ele.authFor == authForOptions.PRE_LOGIN && ele.type === authTypes.CODE,
    );

    if (!userType) {
      user.authTypes.push({
        type: authTypes.CODE,
        authFor: authForOptions.PRE_LOGIN,
        value: hashSync(OTP, 9),
      });
    } else {
      if (user.status === userstatus.Offline) {
        this.checkForSendOTPDuration(userType.expireAt);
      }

      userType.value = hashSync(OTP, 9);
      userType.expireAt = Date.now() + 10 * 60 * 1000;
    }

    await this.mailService.sendEmail({
      to: email,
      subject: 'Login',
      html: `<h1> This is your OTP for Login, The OTP valid for 10 mintues</h1>
          <h2> ${OTP} </h2>
        `,
    });

    await user.save();
    const token = this.jwtService.sign(
      { _id: user._id, email: user.email },
      { secret: this.configService.get<string>('TOKEN_PRE_LOGIN') },
    );

    return {
      message: 'Email sended',
      token,
      status: true,
    };
  }

  async login(token: string, otp: string) {
    const { _id } = this.jwtService.verify(token, {
      secret: this.configService.get<string>('TOKEN_PRE_LOGIN'),
    });

    const user = await this.userModel.findById(_id);

    for (let value of user.authTypes) {
      if (
        value.authFor === authForOptions.PRE_LOGIN &&
        value.type === authTypes.CODE
      ) {
        if (!compareSync(otp.toString(), value.value || '1'))
          throw new BadRequestException('Invalid OTP');

        if (value.expireAt < Date.now())
          throw new BadRequestException('OTP Expired');

        value.value = undefined;
        break;
      }
    }

    const loginToken = this.jwtService.sign(
      { _id: user._id },
      { secret: this.configService.get<string>('TOKEN_LOGIN') },
    );

    user.status = userstatus.Online;
    await user.save();

    return {
      message: 'done',
      token: loginToken,
      status: true,
    };
  }

  async preForgetPassword(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new ConflictException('email not exist');

    const OTP = this.generateOTP();

    const userType = user.authTypes.find(
      (ele) =>
        ele.authFor == authForOptions.FORGET_PASSWORD &&
        ele.type === authTypes.CODE,
    );

    if (!userType) {
      user.authTypes.push({
        type: authTypes.CODE,
        authFor: authForOptions.FORGET_PASSWORD,
        value: hashSync(OTP, 9),
      });
    } else {
      // this.checkForSendOTPDuration(userType.expireAt);
      userType.value = hashSync(OTP, 9);
      userType.expireAt = Date.now() + 10 * 60 * 1000;
    }

    await this.mailService.sendEmail({
      to: email,
      subject: 'Forget password',
      html: `
            <h1> This is your OTP for Forget password, The OTP valid for 10 mintues</h1>
            <h2> ${OTP} </h2>
            `,
    });

    const token = this.jwtService.sign(
      { _id: user._id },
      { secret: this.configService.get<string>('TOKEN_FORGET_PASSWORD') },
    );

    await user.save();

    return {
      message: 'Email Sended',
      status: true,
      token,
    };
  }

  async changeMail(verifyData: string | userType, newEmail: string) {
    if (typeof verifyData == 'string') {
      const { _id } = this.jwtService.verify(verifyData, {
        secret: this.configService.get<string>('TOKEN_SIGNUP'),
      });

      verifyData = (await this.userModel.findById(_id)) as userType;
    }

    const isEmailExist = await this.userModel.findOne({ email: newEmail });

    if (isEmailExist) {
      throw new ConflictException('email is already exist');
    }

    const OTP = customAlphabet('0123456789', 5)();

    const codeDetails = verifyData.authTypes.find(
      (ele) =>
        ele.authFor === authForOptions.CHANGE_EMAIL &&
        ele.type === authTypes.CODE,
    );

    if (codeDetails) {
      this.checkForSendOTPDuration(codeDetails.expireAt);
      codeDetails.value = hashSync(OTP, 9);
      codeDetails.expireAt = Date.now() + 10 * 60 * 1000;
    } else {
      verifyData.authTypes.push({
        authFor: authForOptions.CHANGE_EMAIL,
        type: authTypes.CODE,
        value: hashSync(OTP, 9),
      });
    }

    await this.mailService.sendEmail({
      to: newEmail,
      subject: 'confirm new email',
      html: `<h1> This is your OTP for confirm your new email, The OTP valid for 10 mintues</h1>
        <h2> ${OTP} </h2>
      `,
    });

    await verifyData.save();

    const newMailToken = this.jwtService.sign(
      { email: newEmail, _id: verifyData._id },
      { secret: this.configService.get<string>('TOKEN_SIGNUP') },
    );

    return {
      message: 'Email Sended',
      token: newMailToken,
      status: true,
    };
  }

  async confirmUpdateMail(token: string, otp: string) {
    const { email, _id } = this.jwtService.verify(token, {
      secret: this.configService.get<string>('TOKEN_SIGNUP'),
    });

    const user = await this.userModel.findById(_id);

    for (let type of user.authTypes) {
      if (
        type.authFor === authForOptions.CHANGE_EMAIL &&
        type.type === authTypes.CODE
      ) {
        if (!compareSync(otp.toString(), type.value || '1'))
          throw new BadRequestException('Invalid OTP');

        if (type.expireAt < Date.now())
          throw new BadRequestException('OTP Expired');

        type.value = undefined;
        break;
      }
    }

    user.email = email;
    user.status = userstatus.Offline;
    user.confirmEmail = true;

    await user.save();
    return {
      message: 'Email updated',
      status: true,
    };
  }

  async forgetPassword(token: string, password: string, otp: string) {
    const { _id } = this.jwtService.verify(token, {
      secret: this.configService.get<string>('TOKEN_FORGET_PASSWORD'),
    });

    const user = await this.userModel.findById(_id);

    if (!user)
      throw new NotFoundException('User not found, Please signup first');

    for (let type of user.authTypes) {
      if (
        type.authFor === authForOptions.FORGET_PASSWORD &&
        type.type === authTypes.CODE
      ) {
        if (!compareSync(otp.toString(), type.value || '1'))
          throw new BadRequestException('Invalid OTP');

        if (type.expireAt < Date.now())
          throw new BadRequestException('OTP Expired');

        type.value = undefined;
        break;
      }
    }

    user.password = hashSync(password, 9);
    await user.save();

    return {
      message: 'Done',
      status: true,
    };
  }
}
