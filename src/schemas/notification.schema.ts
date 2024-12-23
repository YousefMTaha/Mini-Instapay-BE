import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';
import { RealtimeModule } from 'src/realtime/realtime.module';
import { UserModule } from 'src/user/user.module';
import { UserService } from 'src/user/user.service';
import { EnotificationType } from 'src/utils/Constants/notification.constants';

@Schema({ versionKey: false, timestamps: { updatedAt: false } })
export class Notification {
  @Prop({ required: true })
  content: string;

  @Prop({ ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ enum: EnotificationType, required: true })
  type: string;

  @Prop({ ref: 'Transaction' })
  transactionId?: Types.ObjectId;

  @Prop({ default: false })
  isRead: boolean;

  readonly _id: Types.ObjectId;
}

const notificationSchema = SchemaFactory.createForClass(Notification);

const notificationModel = MongooseModule.forFeatureAsync([
  {
    name: Notification.name,
    useFactory(notificationGateWay: RealtimeGateway, userService: UserService) {
      notificationSchema.post('save', async function () {
        const user = await userService.findUser({ id: this.userId });
        if (user.socketId) {
          notificationGateWay.sendNotification(user.socketId, this);
        }
      });

      return notificationSchema;
    },
    inject: [RealtimeGateway, UserService],
    imports: [RealtimeModule, UserModule],
  },
]);

export type notificationType = Notification & Document;

export default notificationModel;
