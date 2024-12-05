import {
  InjectModel,
  MongooseModule,
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';
import { Document, Model, Types } from 'mongoose';
import {
  TransactionStatus,
  TransactionType,
} from 'src/utils/Constants/transaction.constants';
import notificationModel, { Notification } from './notification.schema';
import { notificationMsg } from 'src/utils/Constants/notification.constants';
import { UserService } from 'src/user/user.service';
import { UserModule } from 'src/user/user.module';

@Schema({ versionKey: false })
export class Transaction {
  @Prop({ enum: TransactionStatus, default: TransactionStatus.SUCCESS })
  status: string;

  @Prop({ enum: TransactionType })
  type: string;

  @Prop({ required: true, min: 5 })
  amount: number;

  @Prop({ ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ ref: 'User', required: true })
  recieverId: Types.ObjectId;

  readonly _id: Types.ObjectId;
}

const transactionSchema = SchemaFactory.createForClass(Transaction);

const transactionModel = MongooseModule.forFeatureAsync([
  {
    name: 'Transaction',
    useFactory: (
      notificationModel: Model<Notification>,
      UserService: UserService,
    ) => {
      transactionSchema.post('save', async function (doc) {
        let email: string;
        let userId: Types.ObjectId;
        if (doc.type == TransactionType.SEND) {
          email = (await UserService.findById(doc.recieverId)).email;
          userId = doc.senderId;
        } else {
          email = (await UserService.findById(doc.senderId)).email;
          userId = doc.recieverId;
        }

        await notificationModel.create({
          content: notificationMsg({
            amount: doc.amount,
            destination: email,
          }),
          transactionId: doc._id,
          type: doc.type,
          userId,
        });
      });

      return transactionSchema;
    },

    imports: [notificationModel, UserModule],
    inject: [UserService],
  },
]);

export type transactionType = Transaction & Document;

export default transactionModel;
