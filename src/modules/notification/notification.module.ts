import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import notificationModel from 'src/schemas/notification.schema';
import { userModel } from 'src/schemas/user.schema';
import { UserModule } from 'src/modules/user/user.module';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService],
  imports: [notificationModel, userModel, UserModule],
  exports: [NotificationService],
})
export class NotificationModule {}
