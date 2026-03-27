import { ApiProperty } from '@nestjs/swagger';

export class CreateDishDto {
  @ApiProperty({ example: 'Spaghetti Bolognese', description: 'Dish name' })
  name: string;

  @ApiProperty({
    example: 'Classic Italian pasta',
    description: 'Dish description',
    required: false,
  })
  description?: string;

  @ApiProperty({ example: 12.99, description: 'Price' })
  price: number;

  @ApiProperty({
    example: 'http://example.com/dish.png',
    description: 'Image URL',
    required: false,
  })
  image_url?: string;

  @ApiProperty({ example: 1, description: 'Category ID' })
  category_id: bigint;

  @ApiProperty({
    example: true,
    description: 'Is available or out of stock',
    required: false,
    default: true,
  })
  is_available?: boolean;
}
