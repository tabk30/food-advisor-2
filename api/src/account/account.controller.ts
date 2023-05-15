import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Account, EventType } from './entities/account.entity';
import { AggregateAccount } from './entities/aggregate-account.entity';

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post()
  create(@Body() createAccountDto: CreateAccountDto) {
    let aggregateAccount = new AggregateAccount();
    aggregateAccount.createAccount(createAccountDto.name);
    return this.accountService.create(aggregateAccount);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    // return this.accountService.findOne(id);
  }

  @Post('/events/dynamodb')
  async dynamoStreamEvent(@Body() event: any) {
    console.log("dynamoStreamEvent event", event)
  }

  @Patch(':id/withdraw')
  async withdraw(@Param('id') id: string, @Body() updateAccountDto: UpdateAccountDto) {
    const { currentState, snapshot, eventsSinceSnapshot } = await this.accountService.getAccount(id);
    console.log("withdraw", currentState, snapshot, eventsSinceSnapshot);
    const balance = currentState.balance - updateAccountDto.amount;

    const newEvent = {
      type: EventType.WITHDRAW,
      amount: updateAccountDto.amount,
      balance: balance
    }
    return this.accountService.addEvent(id, newEvent, snapshot, eventsSinceSnapshot);
  }

  @Patch(':id/credit')
  async credit(@Param('id') id: string, @Body() updateAccountDto: UpdateAccountDto) {
    const { currentState, snapshot, eventsSinceSnapshot } = await this.accountService.getAccount(id);
    console.log("debit", currentState, snapshot, eventsSinceSnapshot);
    const balance = currentState.balance + updateAccountDto.amount;

    const newEvent = {
      type: EventType.CREDIT,
      amount: updateAccountDto.amount,
      balance: balance
    }
    return this.accountService.addEvent(id, newEvent, snapshot, eventsSinceSnapshot);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    // return this.accountService.remove(+id);
  }
}
