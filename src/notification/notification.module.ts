import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import notificationModel from 'src/schemas/notification.schema';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService],
  imports: [notificationModel],
  exports: [NotificationService],
})
export class NotificationModule {}
