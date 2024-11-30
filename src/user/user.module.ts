import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { userModel } from 'src/schemas/user.schema';
import { MailService } from 'src/utils/email.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [UserController],
  providers: [UserService, MailService],
  imports: [userModel, AuthModule],
})
export class UserModule {}
