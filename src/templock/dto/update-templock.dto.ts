import { PartialType } from '@nestjs/mapped-types';
import { CreateTemplockDto } from './create-templock.dto';

export class UpdateTemplockDto extends PartialType(CreateTemplockDto) {}
