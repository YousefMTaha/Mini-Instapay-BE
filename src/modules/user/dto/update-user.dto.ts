import { PartialType } from '@nestjs/mapped-types';
import { SignupDTO } from 'src/modules/auth/dto/signup.dto';

export class UpdateUserDTO extends PartialType(SignupDTO) {}
