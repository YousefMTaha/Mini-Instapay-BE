import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { notificationType } from 'src/utils/Constants/notification.constants';

@Schema({ versionKey: false })
export class Notification {
  @Prop({ required: true })
  content: string;

  @Prop({ ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ enum: notificationType, required: true })
  type: string;

  @Prop({ ref: 'Transaction', requried: true })
  transactionId: Types.ObjectId;

  @Prop({ default: false })
  isRead: boolean;
}

const notificationSchema = SchemaFactory.createForClass(Notification);

const notificationModel = MongooseModule.forFeature([
  { name: Notification.name, schema: notificationSchema },
]);

export default notificationModel;
