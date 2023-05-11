import { Module } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { RestaurantController } from './restaurant.controller';
import { ConfigModule } from '@nestjs/config';
import { DynamodbService } from './../services/dynamodb/dynamodb.service';
import { EventService } from '../services/event/event.service';

@Module({
  imports: [
    ConfigModule.forRoot()
  ],
  controllers: [RestaurantController],
  providers: [
    RestaurantService,
    EventService,
    DynamodbService
  ]
})
export class RestaurantModule {}
