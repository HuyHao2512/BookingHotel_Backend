import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Amenity } from 'src/amenity/schemas/amenity.schema';
import { Category } from 'src/category/schemas/category.schema';
import { City } from 'src/city/schemas/city.schema';
import { Image } from 'src/image/schemas/image.schema';
import { User } from 'src/users/schemas/user.schema';

export type PropertyDocument = HydratedDocument<Property>;

@Schema({ timestamps: true })
export class Property {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: User;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  category: Category;

  @Prop({ type: Types.ObjectId, ref: 'City', required: true })
  city: City;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Amenity' }] })
  amenities: Amenity[];

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, default: 0 })
  rate: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Image' }], default: [] })
  images: Image[];
}

export const PropertySchema = SchemaFactory.createForClass(Property);
