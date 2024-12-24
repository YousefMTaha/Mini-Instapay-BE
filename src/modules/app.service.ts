import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { Account } from 'src/schemas/account.schema';
import {
  ONE_DAY_MILLI,
  ONE_WEEK_MILLI,
} from 'src/utils/Constants/account.constanta';

@Injectable()
export class AppService {
  constructor(
    @InjectModel(Account.name)
    private readonly accountModel: Model<Account>,
  ) {}

  // @Cron(CronExpression.EVERY_10_SECONDS)
  async updateLimits() {
    console.log(
      'daily',
      await this.accountModel.updateMany(
        { 'limit.type': 'daily', 'limit.endDate': { $lte: Date.now() } },
        {
          'limit.endDate': Date.now() + ONE_DAY_MILLI,
          'limit.spent': 0,
        },
      ),
    );

    console.log(
      'weekly',
      await this.accountModel.updateMany(
        { 'limit.type': 'weekly', 'limit.endDate': { $lte: Date.now() } },
        {
          'limit.endDate': Date.now() + ONE_WEEK_MILLI,
          'limit.spent': 0,
        },
      ),
    );
  }
}
