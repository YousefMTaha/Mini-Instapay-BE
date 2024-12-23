import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  TransactionStatus,
  TransactionType,
} from 'src/utils/Constants/transaction.constants';
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

  @Prop({ required: true, min: 1 })
  amount: number;

  @Prop({ type: Types.ObjectId, ref: 'Account', required: true })
  accSenderId: Types.ObjectId | accountType;

  @Prop({ type: Types.ObjectId, ref: 'Account', required: true })
  accRecieverId: Types.ObjectId | accountType;

  readonly _id: Types.ObjectId;
  readonly createdAt?: Date;
}

const transactionSchema = SchemaFactory.createForClass(Transaction);

const transactionModel = MongooseModule.forFeature([
  {
    name: 'Transaction',
    schema: transactionSchema,
  },
]);

export type transactionType = Transaction & Document;

export default transactionModel;
