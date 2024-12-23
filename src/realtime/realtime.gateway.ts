import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { UserService } from 'src/user/user.service';
import { Server } from 'socket.io';
import { EnotificationType } from 'src/utils/Constants/notification.constants';
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
    console.log(`connection stablished`);

    console.log(client.id);
    this.clientId = client.id;

    const userId = client.handshake.userId;
    const socketId = client.id;

    await this.userService.updateSocketId(userId, socketId);
  }

  handleDisconnect(client: any) {
    console.log(`connection discount`);
    // console.log(client);
  }

  sendNotification(socketId: string, content: notificationType) {
    try {
      this.server.emit('notification', content);
    } catch (error) {
      console.log(error);
    }
  }
  get socketId() {
    return this.clientId;
  }
}
