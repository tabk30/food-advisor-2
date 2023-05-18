import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

function sqsToObject(message: any) {
  let result = {};
  for(let key in message){
    if(message.hasOwnProperty(key)){
      if(message[key]["dataType"] == "String"){
        result[key] = message[key]['stringValue'];
      }else if(message[key]["dataType"] == "Nunber"){
        result[key] = parseInt(message[key]['stringValue']);
      }
    }
  }
  return result;
}

@Controller('restaurant')
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Post()
  async create(@Body() createRestaurantDto: CreateRestaurantDto) {
    return await this.restaurantService.create(createRestaurantDto);
  }

  @Get()
  findAll() {
    return this.restaurantService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.restaurantService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRestaurantDto: UpdateRestaurantDto) {
    return this.restaurantService.update(+id, updateRestaurantDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.restaurantService.remove(+id);
  }

  @Post('event/sqs')
  public sqsEvent(@Body() message) {
    console.log("RestaurantController sqsEvent", message)
    // let mesageList: any[] = message.Records;
    // if (mesageList.length == 0) return;
    // mesageList.map(_message => {
    //   if (_message.body === "NEW_REVIEW") {
    //     console.log("message", sqsToObject(_message.messageAttributes));
    //   }
    // });
  }
}
