import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import notificationModel from 'src/schemas/notification.schema';
import { NotificationGateWay } from './notification.gateway';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService,NotificationGateWay],
  imports: [notificationModel],
  exports: [NotificationService],
})
export class NotificationModule {}
