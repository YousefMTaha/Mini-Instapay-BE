import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Card } from 'src/schemas/card.schema';
import { hashSync } from 'bcryptjs';
@Injectable()
export class CardService {
  constructor(
    @InjectModel(Card.name) private readonly cardModel: Model<Card>,
  ) {}

  async addCard(cardData: any) {
    const card = await this.cardModel.create({
      holderName: cardData.holderName,
      cardNo: cardData.cardNo,
      date: cardData.date,
      CVV: hashSync(cardData.CVV, 9),
    });

    return {
      message: 'created',
      status: true,
      data: card,
    };
  }

  async checkCardExist(cardNo: string) {
    const card = await this.cardModel.findOne({ cardNo });
    if (card) {
      throw new ConflictException('cardNo already linked with account');
    }
  }
}
