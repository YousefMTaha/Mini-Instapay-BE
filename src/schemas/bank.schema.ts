import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ versionKey: false })
export class Bank {
  @Prop({ required: true })
  name: String;

  @Prop({
    type: String,
    default:
      'https://res.cloudinary.com/ducoqbn7x/image/upload/v1733067495/visa_ay9afq.png',
  })
  logo: String;

  readonly _id: Types.ObjectId;
}

const bankSchema = SchemaFactory.createForClass(Bank);

const bankModel = MongooseModule.forFeature([
  { name: 'Bank', schema: bankSchema },
]);

export type bankType = Bank & Document;

export default bankModel;
