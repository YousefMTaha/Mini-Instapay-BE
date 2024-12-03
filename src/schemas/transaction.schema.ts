import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  TransactionStatus,
  TransactionType,
} from 'src/utils/Constants/account.constants';

@Schema({ versionKey: false })
export class Transaction {
  @Prop({ enum: TransactionStatus, default: TransactionStatus.SUCCESS })
  status: string;

  @Prop({ enum: TransactionType })
  type: string;

  @Prop({ required: true, min: 5 })
  amount: Number;

  @Prop({ ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ ref: 'User', required: true })
  recieverId: Types.ObjectId;

  readonly _id: Types.ObjectId;
}

const transactionSchema = SchemaFactory.createForClass(Transaction);

const accountModel = MongooseModule.forFeature([
  { name: 'Transaction', schema: transactionSchema },
]);

export type transactionType = Transaction & Document;

export default accountModel;
