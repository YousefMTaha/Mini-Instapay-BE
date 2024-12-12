import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification } from 'src/schemas/notification.schema';
import { userType } from 'src/schemas/user.schema';
import {
  notificationMsg,
  notificationType,
} from 'src/utils/Constants/notification.constants';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
  ) {}

  async create(data: any) {
    const notification = await this.notificationModel.create({
      content: notificationMsg({
        amount: data.amount,
        destination: data.email,
      })[data.type],
      transactionId: data._id,
      type: data.type,
      userId: data.userId,
    });

    return {
      message: 'done',
      status: true,
      data: notification,
    };
  }

  async getAllNotfications(userId: Types.ObjectId) {
    const notifications = await this.notificationModel.find({ userId });
    if (!notifications.length)
      throw new NotFoundException('There is no notifications yet');
    return {
      messge: 'done',
      status: true,
      data: notifications,
    };
  }

  async sendOrRecieve(
    sender: userType,
    reciever: userType,
    transactionId: Types.ObjectId,
    amount: number,
  ) {
    if (sender._id.toString() === reciever._id.toString()) {
      throw new BadRequestException("You can't send to your self");
    }
    // For sender
    await this.notificationModel.create({
      userId: sender._id,
      type: notificationType.SEND,
      content: notificationMsg({ amount, destination: reciever.email })['Send'],
      amount,
      transactionId,
    });

    // For reciever
    await this.notificationModel.create({
      userId: reciever._id,
      type: notificationType.RECIEVE,
      content: notificationMsg({ amount, destination: sender.email })[
        'Recieved'
      ],
      amount,
      transactionId,
    });

    return {
      message: 'Done, check you notifcation section',
      status: true,
    };
  }

  async recieveRequest(
    sender: userType,
    reciever: userType,
    transactionId: Types.ObjectId,
    amount: number,
  ) {
    // For sender
    await this.notificationModel.create({
      userId: sender._id,
      type: notificationType.REQUEST_SEND,
      content: notificationMsg({ amount, destination: reciever.email })[
        'requestSend'
      ],
      amount,
      transactionId,
    });

    return {
      message: 'Request sended, Wating for sender approve',
      status: true,
    };
  }
  async rejectSend(
    senderEmail: string,
    recieverId: Types.ObjectId,
    transactionId: Types.ObjectId,
    amount: number,
  ) {
    // For reciever
    await this.notificationModel.create({
      userId: recieverId,
      type: notificationType.REQUEST_SEND,
      content: notificationMsg({ destination: senderEmail })['rejectSend'],
      amount,
      transactionId,
    });

    return {
      message: 'Done',
      status: true,
    };
  }
}
