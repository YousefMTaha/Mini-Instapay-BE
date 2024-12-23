import { Module } from '@nestjs/common';
import { CardService } from './card.service';
import cardModel from 'src/schemas/card.schema';

@Module({
  providers: [CardService],
  imports: [cardModel],
})
export class CardModule {}
