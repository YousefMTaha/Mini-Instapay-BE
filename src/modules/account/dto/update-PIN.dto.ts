import { IsString, Length } from 'class-validator';
import { notMatch } from 'src/validators/not-match.validator';

export class UpdatePinDTO {
  @Length(6, 6, { message: 'Old PIN must be 6 characters' })
  oldPIN: string;

  @Length(6, 6, { message: 'New PIN must be 6 characters' })
  @notMatch('oldPIN')
  newPIN: string;
}
