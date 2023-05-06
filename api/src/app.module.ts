import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RestaurantModule } from './restaurant/restaurant.module';
import { RestaurantController } from './restaurant/restaurant.controller';
import { ConfigModule } from '@nestjs/config';
import { TOKEN } from './token';
import { DynamoDB } from 'aws-sdk';

@Module({
  imports: [RestaurantModule, ConfigModule.forRoot({
    isGlobal: true
  })],
  controllers: [AppController, RestaurantController],
  providers: [
    AppService,
    DynamoDB.DocumentClient,
    {
      provide: TOKEN.TABLE_NAME,
      useValue: process.env.tableName
    }
  ],
})
export class AppModule {}
