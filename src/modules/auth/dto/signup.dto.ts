import { IsEmail, IsOptional, Matches, MinLength } from 'class-validator';
import {
  MOBILE_REGEX,
  MOBILE_REGEX_MSG,
  PASSWORD_REGEX,
  PASSWORD_REGEX_MSG,
} from 'src/utils/Constants/user.constants';

export class SignupDTO {
  @MinLength(3)
  firstName: string;

  @MinLength(3)
  lastName: string;

  @Matches(PASSWORD_REGEX, { message: PASSWORD_REGEX_MSG })
  password: string;

  @MinLength(3)
  @IsOptional()
  address?: string;

  @IsEmail()
  email: string;

  @Matches(MOBILE_REGEX, { message: MOBILE_REGEX_MSG })
  mobileNumber: number;
}
