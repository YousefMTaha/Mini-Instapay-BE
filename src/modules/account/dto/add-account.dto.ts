import { Type } from 'class-transformer';
import {
  IsMongoId,
  IsNumber,
  Length,
  Max,
  MaxLength,
  Min,
  MinDate,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';
import { PINDTO } from 'src/utils/common/common.dto';
import { checkCardYear } from 'src/validators/check-card-year.validator';

class DateValidator {
  @IsNumber()
  @Min(1000, { message: 'Year must be 4 digit' })
  @Max(9999, { message: 'Year must be 4 digit' })
  @checkCardYear()
  year: number;

  @IsNumber()
  @Min(1)
  @Max(12)
  month: number;
}

export class AddAccountDTO extends PINDTO {
  @IsMongoId()
  bankId: Types.ObjectId;

  @Length(3, 3, { message: 'CVV must be 3 characters' })
  CVV: string;

  @Length(16, 16, { message: 'Card number must be 16 characters' })
  cardNo: string;

  @Length(3, 20, { message: 'Card holder name must be 3 to 20 characters' })
  holderName: string;

  @ValidateNested()
  @Type(() => DateValidator)
  date: DateValidator;
}
