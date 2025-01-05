import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, userType } from 'src/schemas/user.schema';
import { hashSync, compareSync } from 'bcryptjs';
import {
  authForOptions,
  authTypes,
  userRoles,
  userstatus,
} from 'src/utils/Constants/user.constants';
import { MailService } from 'src/utils/email.service';
import { UpdateUserDTO } from './dto/update-user.dto';
import { UpdatePasswordDTO } from './dto/update-password.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private mailService: MailService,
  ) {}

  async getUser(user: userType) {
    if (user.defaultAcc) {
      await user.populate({
        path: 'defaultAcc',
        select: 'bankId cardId',
        populate: [
          {
            path: 'bankId',
          },
          {
            path: 'cardId',
            select: 'cardNo',
          },
        ],
      });

      //@ts-ignore
      user.defaultAcc.cardId.cardNo = user.defaultAcc.cardId.cardNo.substring(
        //@ts-ignore
        user.defaultAcc.cardId.cardNo.length - 4,
      );
    }

    return {
      message: 'done',
      status: true,
      data: user,
    };
  }

  async updateUser(user: userType, updateData: UpdateUserDTO) {
    if (
      updateData.mobileNumber &&
      user.mobileNumber != updateData.mobileNumber
    ) {
      if (
        await this.userModel.findOne({ mobileNumber: updateData.mobileNumber })
      ) {
        throw new ConflictException('mobile is already exist');
      }
    }

    await user.updateOne(updateData);

    return { message: 'updated', status: true };
  }

  async updatePassword(user: userType, body: UpdatePasswordDTO) {
    const { oldPassword, newPassword } = body;

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

  async logout(user: userType) {
    user.status = userstatus.Offline;
    await user.save();

    return {
      message: 'done',
      status: true,
    };
  }

  async findUser({
    id,
    email,
    data,
  }: {
    id?: Types.ObjectId;
    email?: string;
    data?: string;
  }) {
    let user: userType;

    if (id) user = await this.userModel.findById(id);
    else if (email) user = await this.userModel.findOne({ email });
    else {
      user = await this.userModel.findOne({
        $or: [{ email: data }, { mobileNumber: data }],
      });
    }
    if (!user)
      throw new NotFoundException('No user found for this email or mobile');
    return user;
  }

  async getAll() {
    return await this.userModel.find().select('-password -authTypes');
  }

  async bannedUser(userId: Types.ObjectId) {
    const user = await this.findUser({ id: userId });
    if (user.role === userRoles.Admin) {
      throw new BadRequestException("You can't banned Admin");
    }
    if (user.status === userstatus.Suspended) {
      throw new BadRequestException('Account already banned');
    }

    user.status = userstatus.Suspended;
    await user.save();

    await this.mailService.sendEmail({
      to: user.email,
      subject: 'Account Banned',
      html: `
      <h1> YOU ACCOUNT HAS BEEN BANNED BY ADMIN </h1>
      You can replay to this email for more details
      `,
    });

    return {
      message: 'Suspended',
      status: true,
    };
  }

  async getAllAdmins() {
    const admins = await this.userModel.find({ role: userRoles.Admin });
    if (!admins.length) throw new NotFoundException('There is No admins Yet');
    return admins;
  }

  async updateSocketId(userId: string, socketId: string) {
    await this.userModel.findByIdAndUpdate(userId, { socketId });
  }
}
