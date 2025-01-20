import { Length } from 'class-validator';
import { TokenDTO } from 'src/utils/common/common.dto';

export class ForgetPinDTO extends TokenDTO {
  @Length(6, 6, { message: 'PIN must be 6 characters' })
  PIN: string;
}
