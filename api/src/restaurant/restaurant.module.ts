import { Module } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { RestaurantController } from './restaurant.controller';
import { ConfigModule } from '@nestjs/config';
import { DynamodbModule } from './../services/dynamodb/dynamodb.module';
import { DynamodbService } from './../services/dynamodb/dynamodb.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    DynamodbModule
  ],
  controllers: [RestaurantController],
  providers: [
    RestaurantService,
    DynamodbService
  ]
})
export class RestaurantModule {}
