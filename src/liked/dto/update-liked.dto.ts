import { PartialType } from '@nestjs/mapped-types';
import { CreateLikedDto } from './create-liked.dto';

export class UpdateLikedDto extends PartialType(CreateLikedDto) {}
