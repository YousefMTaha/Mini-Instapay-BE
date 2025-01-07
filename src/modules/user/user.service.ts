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
import { userRoles, userstatus } from 'src/utils/Constants/user.constants';
import { MailService } from 'src/utils/email.service';
import { UpdateUserDTO } from './dto/update-user.dto';
import { UpdatePasswordDTO } from './dto/update-password.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private mailService: MailService,
  ) {}

  /**
   * @description: Get the user data, if the user has a default account, it will be populated and the card number will be only the last 4 digits
   * @param user: The user object
   * @returns: The user data
   */
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

  /**
   * @description: Update the user data
   * @param user: The user object
   * @param updateData: The data to be updated
   * @returns: The updated user data
   */
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

  /**
   * @description: Update the user password
   * @param user: The user object
   * @param body: The new password and the old password
   * @returns: The updated user data
   */
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

  /**
   * @description: Logout the user
   * @param user: The user object
   * @returns: The updated user data
   */
  async logout(user: userType) {
    user.status = userstatus.Offline;
    await user.save();

    return {
      message: 'done',
      status: true,
    };
  }

  /**
   * @description: Find a user by email, mobile number or id
   * @param {id?: string, email?: string, data?: string}:
   * @returns: The user object
   */
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

  /**
   * @description: Get all users
   * @returns: The users data
   */
  async getAll() {
    return await this.userModel.find().select('-password -authTypes');
  }

  /**
   * @description: Ban a user
   * @param userId: The user id
   * @returns: The updated user data
   */
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

  /**
   * @description: Get all admins
   * @returns: The admins data
   */
  async getAllAdmins() {
    const admins = await this.userModel.find({ role: userRoles.Admin });
    if (!admins.length) throw new NotFoundException('There is No admins Yet');
    return admins;
  }

  /**
   * @description: Update the user socket id
   * @param userId: The user id
   * @param socketId: The socket id
   * @returns: The updated user data
   */
  async updateSocketId(userId: string, socketId: string) {
    await this.userModel.findByIdAndUpdate(userId, { socketId });
  }
}
