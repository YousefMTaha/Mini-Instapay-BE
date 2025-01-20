import {
  IsEmail,
  IsMongoId,
  IsNumber,
  IsOptional,
  Length,
  Min,
} from 'class-validator';
import { Types } from 'mongoose';

export class SendMoneyDTO {
  @IsEmail()
  receiverData: string;

  @Length(6, 6, { message: 'PIN must be 6 characters' })
  PIN: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsMongoId()
  @IsOptional()
  accountId?: Types.ObjectId;
}
