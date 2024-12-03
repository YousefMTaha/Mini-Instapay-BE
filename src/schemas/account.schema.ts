import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Mongoose, Types } from 'mongoose';

@Schema({ versionKey: false })
export class Account {
  @Prop({ required: true, length: 16, unique: true })
  cardNo: number;

  @Prop({ required: true })
  CVV: string;

  @Prop({
    required: true,
    type: {
      year: {
        type: Number,
        min: new Date().getFullYear(),
      },
      month: {
        type: Number,
      },
      _id: false,
    },
  })
  date: { year: number; month: number };

  @Prop({ default: 500 })
  Balance: number;

  @Prop({ type: Types.ObjectId, ref: 'Bank', required: true })
  bankId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  PIN: string;

  @Prop({ type: Boolean })
  default: boolean;
}

const accountSchema = SchemaFactory.createForClass(Account);

const accountModel = MongooseModule.forFeature([
  { name: 'Account', schema: accountSchema },
]);

export type accountType = Account & Document;

export default accountModel;
