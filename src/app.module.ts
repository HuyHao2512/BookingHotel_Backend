import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { RefreshTokenModule } from './refresh-token/refresh-token.module';
import { CityModule } from './city/city.module';
import { CategoryModule } from './category/category.module';
import { ImageModule } from './image/image.module';
import { PropertyModule } from './property/property.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { RoomModule } from './room/room.module';
import { TypeRoomModule } from './type-room/type-room.module';
import { AmenityModule } from './amenity/amenity.module';
import { ConvenienceModule } from './convenience/convenience.module';
import { BookingModule } from './booking/booking.module';
import { DiscountModule } from './discount/discount.module';
import { TemplockModule } from './templock/templock.module';
import { EmailService } from './email/email.service';
import { EmailModule } from './email/email.module';
import { LikedModule } from './liked/liked.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/booking'),
    UsersModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    RefreshTokenModule,
    CityModule,
    CategoryModule,
    ImageModule,
    PropertyModule,
    CloudinaryModule,
    RoomModule,
    TypeRoomModule,
    AmenityModule,
    ConvenienceModule,
    BookingModule,
    DiscountModule,
    TemplockModule,
    EmailModule,
    LikedModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: 'APP_GUARD',
      useClass: RolesGuard,
    },
    EmailService,
  ],
})
export class AppModule {}
