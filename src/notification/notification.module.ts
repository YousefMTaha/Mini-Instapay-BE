import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import notificationModel from 'src/schemas/notification.schema';
import { NotificationGateWay } from './notification.gateway';
import { userModel } from 'src/schemas/user.schema';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService,NotificationGateWay],
  imports: [notificationModel,userModel],
  exports: [NotificationService],
})
export class NotificationModule {}
