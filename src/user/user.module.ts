import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { userModel } from 'src/schemas/user.schema';
import { MailService } from 'src/utils/email.service';

@Module({
  controllers: [UserController],
  providers: [UserService,MailService],
  imports: [userModel],
})
export class UserModule {}
