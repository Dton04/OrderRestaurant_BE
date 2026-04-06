import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'dat ton', description: 'Full name' })
  @IsNotEmpty()
  @IsString()
  full_name: string;

  @ApiProperty({ example: 'dat@gmail.com', description: 'Email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', description: 'Password' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: '0123456789',
    description: 'Phone number',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, {
    message: 'Invalid Vietnamese phone number',
  })
  phone?: string;

  @ApiProperty({
    example: 'Số 766 đường Võ Văn Kiệt, Phường Chợ Quán, Quận 5, TP. HCM',
    description: 'Address',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    example: '(GMT+07:00) Bangkok, Hanoi, Jakarta',
    description: 'Timezone',
    required: false,
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ example: 1, description: 'Role ID' })
  @IsNotEmpty()
  role_id: bigint;
}
