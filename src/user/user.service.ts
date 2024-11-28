import {
  BadRequestException,
  Catch,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, userType } from 'src/schemas/user.schema';
import { hashSync, compareSync } from 'bcrypt';
import {
  authForOptions,
  authTypes,
  userstatus,
} from 'src/utils/Constants/user.constants';
import { UnHandledExceptions } from 'src/filters/unhandeldErrors.filter';
import { customAlphabet, nanoid } from 'nanoid';
import { MailService } from 'src/utils/email.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly mailService: MailService,
  ) {}

  async updateUser(user: userType, updateData: any) {
    if (updateData.email && user.email != updateData.email) {
      if (this.userModel.findOne({ email: updateData.email })) {
        throw new ConflictException('email is already exist');
      }
      const OTP = customAlphabet('0123456789', 5)();

      await this.mailService.sendEmail({
        to: updateData.email,
        subject: 'confirm new email',
        html: `<h1> This is your OTP for confirm your new email, The OTP valid for 10 mintues</h1>
          <h2> ${OTP} </h2>
        `,
      });

      for (const ele of user.authTypes) {
        if (
          ele.authFor === authForOptions.SIGNUP &&
          ele.type === authTypes.CODE
        ) {
          ele.value = hashSync(OTP, 9);
          ele.expireAt = Date.now() + 10 * 60 * 1000;
        }
      }

      user.confirmEmail = false;
      user.status = userstatus.Offline;
    }

    if (
      updateData.mobileNumber &&
      user.mobileNumber != updateData.mobileNumber
    ) {
      if (this.userModel.findOne({ mobileNumber: updateData.mobileNumber })) {
        throw new ConflictException('mobile is already exist');
      }
    }

    await user.updateOne(updateData);

    return { message: 'updated', status: true };
  }

  async checkForMobile(mobileNumber: string) {}

  async updatePassword(user: userType, body: any) {
    const { oldPassword, newPassword } = body;

    if (oldPassword == newPassword) {
      throw new BadRequestException('The password same as the old one');
    }

    const currentUser = await this.userModel.findById(user._id);

    if (!compareSync(oldPassword, currentUser.password)) {
      throw new BadRequestException("Old Password isn't correct");
    }

    await user.updateOne({
      password: hashSync(newPassword, 9),
      status: userstatus.Offline,
    });

    return {
      message: 'updated',
      status: true,
    };
  }
}
