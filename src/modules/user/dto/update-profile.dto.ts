import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Nguyen Van A Edit', description: 'Full Name' })
  @IsNotEmpty()
  @IsString()
  full_name: string;

  @ApiProperty({ example: '0988776655', description: 'Phone number', required: false })
  @IsOptional()
  @IsString()
  @Matches(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, { message: 'Invalid Vietnamese phone number' })
  phone?: string;
}
