import { IsEmail } from 'class-validator';
import { TokenDTO } from 'src/utils/common/common.dto';

export class UpdateEmailDTO extends TokenDTO {
  @IsEmail()
  email: string;
}
