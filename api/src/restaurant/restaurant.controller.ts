import { Controller, Get, Post, Body, Patch, Param, Delete, Put, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
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
  async findOne(@Param('id') id: string) {
    const parts: string[] = id.split(',');
    if (parts.length < 2) throw new HttpException({
      status: HttpStatus.BAD_REQUEST,
      error: 'restaurant id invalid!',
    }, HttpStatus.BAD_REQUEST);

    return await this.restaurantService.findOne(parts[0], parts[1]);
  }

  @Put(':id')
  update(
    @Param('id') id: string, 
    @Body() updateRestaurantDto: UpdateRestaurantDto
  ) {
    const parts: string[] = id.split(',');
    if (parts.length < 2) throw new HttpException({
      status: HttpStatus.BAD_REQUEST,
      error: 'restaurant id invalid!',
    }, HttpStatus.BAD_REQUEST);

    return this.restaurantService.update(parts[0], parts[1], updateRestaurantDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    const parts: string[] = id.split(',');
    if (parts.length < 2) throw new HttpException({
      status: HttpStatus.BAD_REQUEST,
      error: 'restaurant id invalid!',
    }, HttpStatus.BAD_REQUEST);
    return this.restaurantService.remove(parts[0], parts[1]);
  }
}
