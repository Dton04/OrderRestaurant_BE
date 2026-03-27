import { ApiProperty } from '@nestjs/swagger';

export class CreateTableDto {
  @ApiProperty({ example: 'T1', description: 'Table number' })
  table_number: string;

  @ApiProperty({ example: 4, description: 'Capacity' })
  capacity: number;

  @ApiProperty({
    example: 'FREE',
    description: 'Status (FREE, OCCUPIED, RESERVED, CLEANING)',
  })
  status: string;

  @ApiProperty({ example: 1, description: 'Area ID' })
  area_id: bigint;
}
