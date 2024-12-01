import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Mongoose, Types } from 'mongoose';

@Schema()
export class Account {
  @Prop({ required: true, length: 16, unique: true })
  cardNo: Number;

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
    },
  })
  date: { year: number; month: number };

  @Prop({ default: 500 })
  Balance: Number;

  @Prop({ type: Types.ObjectId, ref: 'Bank', required: true })
  bankId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  PIN: string;

  @Prop({ type: Boolean })
  default: Boolean;
}

const accountSchema = SchemaFactory.createForClass(Account);

const accountModel = MongooseModule.forFeature([
  { name: 'Account', schema: accountSchema },
]);

export type accountType = Account & Document;

export default accountModel;
