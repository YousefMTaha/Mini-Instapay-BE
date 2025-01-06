import { IsEnum } from 'class-validator';
import { TokenDTO } from 'src/utils/common/common.dto';
import { authForOptions } from 'src/utils/Constants/user.constants';

export class ResendMailDTO extends TokenDTO {
  @IsEnum(authForOptions)
  type: authForOptions;
}
