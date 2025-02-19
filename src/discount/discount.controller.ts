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

  //xem chi tiết mã giảm giá
  @Get(':code')
  @Roles(Role.Owner)
  findOne(@Param('code') code: string) {
    return this.discountService.findOne(code);
  }

  @Patch(':code')
  @Roles(Role.Owner, Role.Admin)
  update(
    @Param('code') code: string,
    @Body() updateDiscountDto: UpdateDiscountDto,
  ) {
    return this.discountService.update(code, updateDiscountDto);
  }

  @Delete(':code')
  @Roles(Role.Owner, Role.Admin)
  remove(@Param('code') code: string) {
    return this.discountService.remove(code);
  }
}
