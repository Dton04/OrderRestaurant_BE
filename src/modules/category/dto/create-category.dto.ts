import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Main Course', description: 'Category Name' })
  name: string;

  @ApiProperty({
    example: 'Delicious main courses',
    description: 'Category Description',
    required: false,
  })
  description?: string;

  @ApiProperty({
    example: 'http://example.com/image.png',
    description: 'Category Image URL',
    required: false,
  })
  image_url?: string;
}
