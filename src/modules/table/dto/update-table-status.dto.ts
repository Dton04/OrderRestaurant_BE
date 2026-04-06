import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';

export enum TableStatusEnum {
  FREE = 'FREE',
  RESERVED = 'RESERVED',
  CLEANING = 'CLEANING',
  // OCCUPIED is managed by system, but allowed if manual override is needed
  OCCUPIED = 'OCCUPIED',
}

export class UpdateTableStatusDto {
  @ApiProperty({
    example: 'FREE',
    description: 'Trạng thái bàn (FREE, RESERVED, CLEANING, OCCUPIED)',
    enum: TableStatusEnum,
  })
  @IsEnum(TableStatusEnum)
  status: TableStatusEnum;
}
