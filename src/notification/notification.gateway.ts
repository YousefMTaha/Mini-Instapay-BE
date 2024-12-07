import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { notificationType } from 'src/utils/Constants/notification.constants';

@WebSocketGateway({ cors: true })
export class NotificationGateWay
  implements OnGatewayConnection, OnGatewayDisconnect
{
  handleConnection(client: any, ...args: any[]) {
    console.log(`connection stablished`);

    console.log(client);
    console.log(args);
  }

  handleDisconnect(client: any) {
    console.log(`connection discount`);
    console.log(client);
  }

  @SubscribeMessage('send_notification')
  handelEvents(@MessageBody() notification: notificationType) {
    console.log(notification);
  }
}
