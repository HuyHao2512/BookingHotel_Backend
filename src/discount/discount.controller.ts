import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { DiscountService } from './discount.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { Roles } from 'src/decorator/roles.decorator';
import { Role } from 'src/auth/enum';

@Controller('discounts')
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  @Post()
  @Roles(Role.Owner, Role.Admin)
  create(@Body() createDiscountDto: CreateDiscountDto) {
    return this.discountService.create(createDiscountDto);
  }

  @Get()
  @Roles(Role.Admin)
  findAll() {
    return this.discountService.findAll();
  }
  @Get('property/:propertyId')
  @Roles(Role.Owner, Role.Admin)
  findByProperty(@Param('propertyId') propertyId: string) {
    return this.discountService.findByProperty(propertyId);
  }

  @Patch(':code/is-active')
  @Roles(Role.Owner, Role.Admin)
  async updateIsActive(
    @Param('code') code: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.discountService.updateIsActive(code, isActive);
  }
}
