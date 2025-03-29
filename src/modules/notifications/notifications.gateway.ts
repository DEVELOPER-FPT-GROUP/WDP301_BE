import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnModuleInit } from '@nestjs/common';
import { AuthService } from '../auth/service/auth.service';
import { NotificationsService } from './service/notifications.service';

export interface JwtPayload {
  username: string;

  memberId: string | null;

  familyId: string | null;

  jti: string;

  role: string;

  familyName: string | null;

  exp?: number;

  iat?: number;
}

export interface socketMetaPayload extends JwtPayload {
  socketId: string;
}
@WebSocketGateway({
  crossOriginIsolated: true,
})
export class NotificationsGateway implements OnModuleInit {
  @WebSocketServer()
  server: Server;
  socketMap = new Map<string, socketMetaPayload>();

  constructor(
    private readonly authService: AuthService,
    private readonly notificationsService: NotificationsService
  ) {
  }

  onModuleInit(): any {
    this.server.on('connection', async (socket: Socket) => {
      const token = socket.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        socket.disconnect(true);
        return;
      }

      const payload = this.authService.verifyJwt(token);
      if (payload && payload.username) {
        // Store socket information with user data
        this.socketMap.set(payload.username, {
          ...payload,
          socketId: socket.id
        });

        // Join a room specific to this user
        socket.join(`user_${payload.username}`);

        // Send any pending notifications
        const notifications = await this.notificationsService.findAll();
        socket.emit('pending_notifications', notifications);
      }

      socket.on('disconnect', () => {
        if (payload && payload.username) {
          this.socketMap.delete(payload.username);
        }
      });
    });
  }

  // Broadcast notification to specific users
  async broadcastNotification(recipientIds: string[], notification: any) {
    for (const recipientId of recipientIds) {
      this.server.to(`user_${recipientId}`).emit('new_notification', notification);
    }
  }

  // Handle mark as read event
  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(socket: Socket, recipientId: string) {
    await this.notificationsService.markNotificationAsRead(recipientId);
    socket.emit('notification_marked_read', { recipientId });
  }
}
