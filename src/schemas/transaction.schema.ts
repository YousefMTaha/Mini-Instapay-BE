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

import { UserService } from 'src/user/user.service';
import { UserModule } from 'src/user/user.module';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationModule } from 'src/notification/notification.module';

@Schema({
  versionKey: false,
  timestamps: {
    updatedAt: false,
  },
})
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
      UserService: UserService,
      notificationService: NotificationService,
    ) => {
      // transactionSchema.post('save', async function (doc) {

      // });

      return transactionSchema;
    },

    imports: [UserModule, NotificationModule],
    inject: [UserService, NotificationService],
  },
]);

export type transactionType = Transaction & Document;

export default transactionModel;
