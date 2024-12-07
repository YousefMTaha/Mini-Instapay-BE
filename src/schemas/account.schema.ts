import { BadRequestException } from '@nestjs/common';
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ versionKey: false })
export class Account {
  @Prop({ default: 500 })
  Balance: number;

  @Prop({ type: Types.ObjectId, ref: 'Bank', required: true })
  bankId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Card', required: true })
  cardId: Types.ObjectId;

  @Prop({ required: true })
  PIN: string;

  @Prop({ type: Boolean })
  default: boolean;
}

const accountSchema = SchemaFactory.createForClass(Account);

accountSchema.method('checkAmount', function (amount: number) {
  if (amount > this.Balance)
    throw new BadRequestException("you don't have enough money");
});

const accountModel = MongooseModule.forFeature([
  { name: 'Account', schema: accountSchema },
]);

export type accountType = Account &
  Document & { checkAmount?(amount: number): void };

export default accountModel;
