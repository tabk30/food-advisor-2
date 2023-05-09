import { Controller, Get, Post, Body, Patch, Param, Delete, Put } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

@Controller('restaurant')
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) { }

  @Post()
  create(@Body() createRestaurantDto: CreateRestaurantDto) {
    return this.restaurantService.create(createRestaurantDto);
  }

  @Get()
  findAll() {
    return this.restaurantService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const parts: string[] = id.split(',');
    if (parts.length < 2) throw Error("restaurantt id invalid!");
    return this.restaurantService.findOne(parts[0], parts[1]);
  }

  @Put(':id')
  update(
    @Param('id') id: string, 
    @Body() updateRestaurantDto: UpdateRestaurantDto
  ) {
    const parts: string[] = id.split(',');
    if (parts.length < 2) throw Error("restaurantt id invalid!");

    return this.restaurantService.update(parts[0], parts[1], updateRestaurantDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.restaurantService.remove(+id);
  }
}
