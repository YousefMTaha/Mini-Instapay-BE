import { Matches } from 'class-validator';
import { TokenDTO } from 'src/utils/common/common.dto';
import {
  PASSWORD_REGEX,
  PASSWORD_REGEX_MSG,
} from 'src/utils/Constants/user.constants';

export class ForgetPasswordDTO extends TokenDTO {
  @Matches(PASSWORD_REGEX, { message: PASSWORD_REGEX_MSG })
  password: string;
}
