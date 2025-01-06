import { IsEmail, Matches } from 'class-validator';
import {
  PASSWORD_REGEX,
  PASSWORD_REGEX_MSG,
} from 'src/utils/Constants/user.constants';

export class PreLoginDTO {
  @IsEmail()
  email: string;

  @Matches(PASSWORD_REGEX, { message: PASSWORD_REGEX_MSG })
  password: string;
}
