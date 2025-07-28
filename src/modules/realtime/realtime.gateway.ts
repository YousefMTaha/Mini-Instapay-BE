import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { UserService } from 'src/modules/user/user.service';
import { Server } from 'socket.io';
import { notificationType } from 'src/schemas/notification.schema';

@WebSocketGateway({ cors: true })
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server: Server;
  private clientId: string;

  constructor(private userService: UserService) {}

  async handleConnection(client: any, ...args: any[]) {
    console.log(`connection to socket.io success...`);

    console.log(client.id);
    this.clientId = client.id;

    const userId = client.handshake.auth.userId;
    const socketId = client.id;

    await this.userService.updateSocketId(userId, socketId);
  }

  handleDisconnect(client: any) {
    console.log(`connection discount`);
    // console.log(client);
  }

  sendNotification(socketId: string, content: notificationType) {
    try {
      this.server.to([socketId]).emit('notification', content);
    } catch (error) {
      console.log(error);
    }
  }
  get socketId() {
    return this.clientId;
  }
}
