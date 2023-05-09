import { Module } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { RestaurantController } from './restaurant.controller';

@Module({
  imports: [],
  controllers: [RestaurantController],
  providers: [
    RestaurantService
  ]
})
export class RestaurantModule {}
