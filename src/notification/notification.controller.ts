import { Controller, Get, UseFilters, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { currentUser } from 'src/decorators/current-user.decortaor';
import { userType } from 'src/schemas/user.schema';
import { UnHandledExceptions } from 'src/filters/unhandeldErrors.filter';
import { AuthGuard } from 'src/guards/auth.guard';

@UseGuards(AuthGuard)
@UseFilters(UnHandledExceptions)
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}
  @Get()
  getAll(@currentUser() user: userType) {
    return this.notificationService.getAllNotfications(user._id);
  }
}
