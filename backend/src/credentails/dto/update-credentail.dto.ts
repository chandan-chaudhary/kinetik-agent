import { PartialType } from '@nestjs/mapped-types';
import { CreateCredentailDto } from './create-credentail.dto';

export class UpdateCredentailDto extends PartialType(CreateCredentailDto) {}
