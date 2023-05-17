import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Account, EventType } from './entities/account.entity';
import { AggregateAccount } from './entities/aggregate-account.entity';
import { unmarshall } from '@aws-sdk/util-dynamodb';

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
  async findOne(@Param('id') id: string) {
    return await this.accountService.findOne(id);
  }

  @Get()
  async find(@Query() query: any) {
    console.log("find", query);
    return await this.accountService.findAll(query);
  }

  @Post('/events/dynamodb')
  async dynamoStreamEvent(@Body() event: any) {
    let records: any[] = event.Records
    for(let key in records) {
      const record = records[key];
      
      if(record.dynamodb && record.dynamodb.NewImage){
        const recordObject = unmarshall(record.dynamodb.NewImage);
        await this.accountService.eventProcess({
          id: recordObject["id"],
          version: recordObject["version"],
          type: recordObject["type"],
          amount: recordObject["amount"],
          payload: recordObject["payload"] ? {
            id: recordObject["payload"]["id"],
            balance: recordObject["payload"]["balance"],
            name: recordObject["payload"]["name"],
          } : undefined
        });
      }
      
    }
  }

  @Patch(':id/withdraw')
  async withdraw(@Param('id') id: string, @Body() updateAccountDto: UpdateAccountDto) {
    const { currentState, snapshot, eventsSinceSnapshot } = await this.accountService.getAccount(id);
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

  @Post('/events/stepfunction')
  async stepFunctionEvent(@Body() event: any) {
    console.log("stepFunctionEvent", event);
  }
}
