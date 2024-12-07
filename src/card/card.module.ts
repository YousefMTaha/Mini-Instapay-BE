import { Module } from '@nestjs/common';
import { CardService } from './card.service';
import { CardController } from './card.controller';
import cardModel from 'src/schemas/card.schema';

@Module({
  controllers: [CardController],
  providers: [CardService],
  imports: [cardModel],
})
export class CardModule {}
