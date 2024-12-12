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
import { accountType } from './account.schema';

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

  @Prop({ type: Types.ObjectId, ref: 'Account', required: true })
  accSenderId: Types.ObjectId | accountType;

  @Prop({ type: Types.ObjectId, ref: 'Account', required: true })
  accRecieverId: Types.ObjectId | accountType;

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
