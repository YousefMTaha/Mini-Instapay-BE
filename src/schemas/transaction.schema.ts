import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  TransactionStatus,
  TransactionType,
} from 'src/utils/Constants/transaction.constants';
import { accountType } from './account.schema';
import { NotificationService } from 'src/modules/notification/notification.service';
import { NotificationModule } from 'src/modules/notification/notification.module';
import { cardType } from './card.schema';

@Schema({
  versionKey: false,
  timestamps: {
    updatedAt: false,
  },
})
export class Transaction {
  @Prop({ enum: TransactionStatus, default: TransactionStatus.SUCCESS })
  status: string;

  @Prop({ enum: TransactionType })
  type: string;

  @Prop({ required: true, min: 1 })
  amount: number;

  @Prop({ type: Types.ObjectId, ref: 'Account', required: true })
  accSenderId: Types.ObjectId | accountType;

  @Prop({ type: Types.ObjectId, ref: 'Account', required: true })
  accReceiverId: Types.ObjectId | accountType;

  readonly _id: Types.ObjectId;
  readonly createdAt?: Date;
}

const transactionSchema = SchemaFactory.createForClass(Transaction);

const transactionModel = MongooseModule.forFeatureAsync([
  {
    name: 'Transaction',
    useFactory(notificationService: NotificationService) {
      transactionSchema.post('save', async function () {
        const senderAccount = (await this.populate('accSenderId'))
          .accSenderId as accountType;
        if (senderAccount.Balance < 200) {
          const card = (await senderAccount.populate('cardId'))
            .cardId as cardType;

          await notificationService.lowBalance(
            card.cardNo,
            senderAccount.userId as Types.ObjectId,
          );
        }

        await senderAccount.updateOne({ $inc: { 'limit.spent': this.amount } });
      });

      return transactionSchema;
    },
    inject: [NotificationService],
    imports: [NotificationModule],
  },
]);

export type transactionType = Transaction & Document;

export default transactionModel;
