import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MailService } from 'src/utils/email.service';
import { userModel } from 'src/schemas/user.schema';

@Module({
  imports: [userModel],
  controllers: [AuthController],
  providers: [AuthService, MailService],
  exports: [AuthService , userModel],
})
export class AuthModule {}
