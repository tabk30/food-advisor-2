import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DynamodbService } from './services/dynamodb/dynamodb.service';
import { DynamodbModule } from './services/dynamodb/dynamodb.module';
import { AccountModule } from './account/account.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    DynamodbModule,
    AccountModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    DynamodbService
  ],
})
export class AppModule {}
