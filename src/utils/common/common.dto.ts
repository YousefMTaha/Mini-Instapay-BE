import { IsEmail, IsMongoId, Length, Matches } from 'class-validator';
import {
  MOBILE_REGEX,
  TOKEN_REGEX_MSG,
  TOKEN_REGEX,
} from '../Constants/user.constants';
import { MOBILE_REGEX_MSG } from '../Constants/user.constants';
import { Types } from 'mongoose';

export class OTPDTO {
  @Length(6, 6, { message: 'OTP must be 6 characters' })
  otp: string;
}

export class EmailDTO {
  @IsEmail()
  email: string;
}

export class MobileDTO {
  @Matches(MOBILE_REGEX, { message: MOBILE_REGEX_MSG })
  mobileNumber: number;
}

export class TokenDTO {
  @Matches(TOKEN_REGEX, { message: TOKEN_REGEX_MSG })
  token: string;
}

export class ObjectIdDTO {
  @IsMongoId()
  id: Types.ObjectId;
}

export class TokenAndOTPValidator {
  @Length(6, 6, { message: 'OTP must be 6 characters' })
  otp: string;

  @Matches(TOKEN_REGEX, { message: TOKEN_REGEX_MSG })
  token: string;
}
