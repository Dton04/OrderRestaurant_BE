import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CancelOrderDto {
  @ApiProperty({ example: 'Khách bận việc đột xuất', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
