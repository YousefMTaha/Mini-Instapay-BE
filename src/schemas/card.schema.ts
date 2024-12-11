import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ versionKey: false })
export class Card {
  @Prop({ required: true, length: 16, unique: true })
  cardNo: string;

  @Prop({ required: true })
  CVV: string;

  @Prop({ required: true })
  holderName: string;

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

  readonly _id: Types.ObjectId;
}

const cardSchema = SchemaFactory.createForClass(Card);

const cardModel = MongooseModule.forFeature([
  { name: 'Card', schema: cardSchema },
]);

export type cardType = Card & Document;

export default cardModel;
