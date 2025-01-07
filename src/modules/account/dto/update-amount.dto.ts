import { IsEnum, IsNumber, Min } from 'class-validator';
import { limitType } from 'src/utils/Constants/account.constanta';

export class UpdateLimitDTO {
  @IsEnum(limitType)
  type: limitType;

  @IsNumber()
  @Min(1)
  amount: number;
}
