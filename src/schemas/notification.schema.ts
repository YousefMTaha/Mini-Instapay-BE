import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
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

const notificationModel = MongooseModule.forFeature([
  { name: Notification.name, schema: notificationSchema },
]);

export type notificationType = Notification & Document;

export default notificationModel;
