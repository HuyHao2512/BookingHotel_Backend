import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { DiscountService } from './discount.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { Roles } from 'src/decorator/roles.decorator';
import { Role } from 'src/auth/enum';
import { Public } from 'src/decorator/customize';

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
  @Get('public')
  @Public()
  getDiscountPublic() {
    return this.discountService.getDiscountPublic();
  }

  @Get(':code')
  @Public()
  findOne(@Param('code') code: string) {
    return this.discountService.findOne(code);
  }

  @Post('verify')
  @Public()
  async verifyDiscount(
    @Body() verifyDiscountDto: { userId: string; code: string },
  ) {
    return this.discountService.verifyDiscount(
      verifyDiscountDto.userId,
      verifyDiscountDto.code,
    );
  }

  // API áp dụng mã
  @Post('apply')
  @Public()
  async applyDiscount(
    @Body() applyDiscountDto: { userId: string; code: string },
  ) {
    return this.discountService.applyDiscount(
      applyDiscountDto.userId,
      applyDiscountDto.code,
    );
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
