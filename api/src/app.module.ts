import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RestaurantModule } from './restaurant/restaurant.module';
import { DynamodbService } from './services/dynamodb/dynamodb.service';
import { ConfigModule } from '@nestjs/config';
import { DynamodbModule } from './services/dynamodb/dynamodb.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    RestaurantModule,
    DynamodbModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    DynamodbService
  ],
})
export class AppModule {}
