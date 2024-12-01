import { Module } from '@nestjs/common';
import { BankService } from './bank.service';
import { BankController } from './bank.controller';
import bankModel from 'src/schemas/bank.schema';

@Module({
  controllers: [BankController],
  providers: [BankService],
  imports: [bankModel],
})
export class BankModule {}
