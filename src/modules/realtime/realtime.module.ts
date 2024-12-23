import { Module } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { UserModule } from 'src/modules/user/user.module';

@Module({
  imports: [UserModule],
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
