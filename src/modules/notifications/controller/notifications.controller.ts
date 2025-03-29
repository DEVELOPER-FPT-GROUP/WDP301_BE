import {
  Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UseGuards,
} from '@nestjs/common';
import { NotificationsService } from '../service/notifications.service';
import { CreateNotificationDto } from '../dto/request/create-notification.dto';
import { UpdateNotificationDto } from '../dto/request/update-notification.dto';
import { LoggingInterceptor } from 'src/common/interceptors/logging.interceptor';
import { winstonLogger as logger } from 'src/common/winston-logger';
import { ResponseDTO } from 'src/utils/response.dto';
import { NotificationResponseDto } from '../dto/response/notification-response.dto';
import { Roles } from '../../auth/decorator/roles.decorator';
import { Role } from '../../../utils/enum';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';

@UseInterceptors(LoggingInterceptor)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Create a new notification
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  async createNotification(
    @Body() createNotificationDto: CreateNotificationDto
  ): Promise<ResponseDTO<NotificationResponseDto>> {
    logger.http(`Received POST request to create a notification for event ID: ${createNotificationDto.eventId}`);
    const result = await this.notificationsService.create(createNotificationDto);
    return ResponseDTO.success(result, 'Notification created successfully');
  }

  /**
   * Get all notifications
   */
  @Get()
  async getAllNotifications(): Promise<ResponseDTO<NotificationResponseDto[]>> {
    logger.http(`Received GET request to fetch all notifications`);
    const result = await this.notificationsService.findAll();
    return ResponseDTO.success(result, 'Notifications fetched successfully');
  }

  /**
   * Get notification by ID
   */
  @Get(':id')
  async getNotificationById(
    @Param('id') id: string
  ): Promise<ResponseDTO<NotificationResponseDto>> {
    logger.http(`Received GET request to fetch notification with ID: ${id}`);
    const result = await this.notificationsService.findOne(id);
    return ResponseDTO.success(result, `Notification with ID ${id} retrieved successfully`);
  }

  /**
   * Update notification by ID
   */
  @Patch(':id')
  async updateNotification(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto
  ): Promise<ResponseDTO<NotificationResponseDto>> {
    logger.http(`Received PATCH request to update notification with ID: ${id}`);
    const result = await this.notificationsService.update(id, updateNotificationDto);
    return ResponseDTO.success(result, `Notification with ID ${id} updated successfully`);
  }

  /**
   * Delete notification by ID
   */
  @Delete(':id')
  async deleteNotification(
    @Param('id') id: string
  ): Promise<ResponseDTO<null>> {
    logger.http(`Received DELETE request to remove notification with ID: ${id}`);
    await this.notificationsService.remove(id);
    return ResponseDTO.success(null, `Notification with ID ${id} deleted successfully`);
  }
}
