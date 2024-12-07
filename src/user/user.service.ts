import {
  BadRequestException,
  Catch,
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
  userstatus,
} from 'src/utils/Constants/user.constants';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async getUser(user: userType) {
    return {
      message: 'done',
      status: true,
      data: user,
    };
  }

  async updateUser(user: userType, updateData: any) {
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

  async logout(user: userType) {
    user.status = userstatus.Offline;
    await user.save();

    return {
      message: 'done',
      status: true,
    };
  }

  async findUser({ id, email }: { id?: Types.ObjectId; email?: string }) {
    let user: userType;

    if (id) user = await this.userModel.findById(id);
    else user = await this.userModel.findOne({ email });

    if (!user) throw new NotFoundException(404);
    return user;
  }
}
