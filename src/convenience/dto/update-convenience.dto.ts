import { PartialType } from '@nestjs/mapped-types';
import { CreateConvenienceDto } from './create-convenience.dto';

export class UpdateConvenienceDto extends PartialType(CreateConvenienceDto) {}
