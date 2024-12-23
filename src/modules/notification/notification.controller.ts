import {
  Controller,
  Get,
  Param,
  Patch,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { currentUser } from 'src/decorators/current-user.decortaor';
import { userType } from 'src/schemas/user.schema';
import { UnHandledExceptions } from 'src/filters/unhandeldErrors.filter';
import { AuthGuard } from 'src/guards/auth.guard';
import { Types } from 'mongoose';

@UseGuards(AuthGuard)
// useFilte(UnHandledExceptions)
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}
  @Get()
  getAll(@currentUser() user: userType) {
    return this.notificationService.getAllNotfications(user._id);
  }

  @Patch('markAsRead/:notificationId')
  async markAsRead(
    @currentUser() user: userType,
    @Param('notificationId') notificationId: Types.ObjectId,
  ) {
    const notification = await this.notificationService.findById(
      user,
      notificationId,
    );
    return this.notificationService.markAsRead(notification);
  }
}
