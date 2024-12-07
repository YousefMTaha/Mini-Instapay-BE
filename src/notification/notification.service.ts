import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from 'src/schemas/notification.schema';
import { notificationMsg } from 'src/utils/Constants/notification.constants';

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
}
