import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { NotificationsService } from './service/notifications.service';

@WebSocketGateway({
  cors: {
    origin: '*', // In production, specify your frontend URL
  },
  namespace: 'notifications',
})
@Injectable()
export class NotificationsGateway {
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly notificationsService: NotificationsService) {}

  afterInit() {
    this.logger.log('Notifications WebSocket Gateway initialized');
  }

  @SubscribeMessage('connect_user')
  handleConnection(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId: string }
  ) {
    const { userId } = payload;

    if (!userId) {
      client.disconnect();
      return { success: false, message: 'User ID is required' };
    }

    // Store the connection
    this.notificationsService.handleUserConnection(userId, client.id);

    this.logger.log(`Client connected: ${client.id} for user: ${userId}`);
    return { success: true };
  }

  @SubscribeMessage('disconnect_user')
  handleDisconnect(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId: string }
  ) {
    const { userId } = payload;

    if (userId) {
      this.notificationsService.handleUserDisconnection(userId, client.id);
    }

    this.logger.log(`Client disconnected: ${client.id}`);
    return { success: true };
  }

  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @MessageBody() payload: { notificationId: string, recipientId: string }
  ) {
    try {
      await this.notificationsService.markNotificationAsRead(payload.recipientId);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error marking notification as read: ${error.message}`);
      return { success: false, message: error.message };
    }
  }
}
