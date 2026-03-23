import {
  IsBoolean,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const CREDENTIAL_TYPES = ['LLM', 'MARKET', 'DATABASE', 'OTHER'] as const;

export class CreateCredentailDto {
  @IsString()
  @MaxLength(80)
  name!: string;

  @IsString()
  @IsIn(CREDENTIAL_TYPES)
  type!: (typeof CREDENTIAL_TYPES)[number];

  @IsString()
  @MaxLength(80)
  provider!: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
