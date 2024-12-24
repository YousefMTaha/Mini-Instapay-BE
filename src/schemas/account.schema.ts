import { BadRequestException } from '@nestjs/common';
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { userType } from './user.schema';
import {
  limitType,
  ONE_WEEK_MILLI,
} from 'src/utils/Constants/account.constanta';
import { cardType } from './card.schema';

@Schema({ versionKey: false })
export class Account {
  @Prop({ default: 500 })
  Balance: number;

  @Prop({ type: Types.ObjectId, ref: 'Bank', required: true })
  bankId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId | userType;

  @Prop({ type: Types.ObjectId, ref: 'Card', required: true })
  cardId: Types.ObjectId | cardType;

  @Prop({ required: true })
  PIN: string;

  @Prop({ default: 0 })
  wrongPIN: number;

  @Prop({
    type: { type: String, enum: limitType, default: limitType.WEEKLY },
    amount: { type: Number, default: 1000 },
    endDate: { type: Date, default: Date.now() + ONE_WEEK_MILLI },
    spent: { type: Number, default: 0 },
  })
  limit: {
    type?: string;
    amount?: number;
    endDate?: Date | number;
    spent?: number;
  };

  readonly _id: Types.ObjectId;
}

const accountSchema = SchemaFactory.createForClass(Account);

accountSchema.method('checkAmount', function (amount: number) {
  if (amount > this.Balance)
    throw new BadRequestException("You don't have enough money");
});

accountSchema.method('checkNoOfTries', function () {
  return !(this.wrongPIN >= 5);
});

const accountModel = MongooseModule.forFeature([
  { name: 'Account', schema: accountSchema },
]);

export type accountType = Account &
  Document & { checkAmount?(amount: number): void; checkNoOfTries?(): boolean };

export default accountModel;
