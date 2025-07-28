import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { currentUser } from 'src/decorators/current-user.decorator';
import { userType } from 'src/schemas/user.schema';
import { AuthGuard } from 'src/guards/auth.guard';
import { ObjectIdDTO } from 'src/utils/common/common.dto';

@UseGuards(AuthGuard)
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}
  @Get()
  getAll(@currentUser() user: userType) {
    return this.notificationService.getAllNotifications(user._id);
  }

  @Patch('markAsRead/:id')
  async markAsRead(@currentUser() user: userType, @Param() param: ObjectIdDTO) {
    const notification = await this.notificationService.findById(
      user,
      param.id,
    );
    return this.notificationService.markAsRead(notification);
  }
}
