import { ApiProperty } from '@nestjs/swagger';

class CreateOrderItemDto {
  @ApiProperty({ example: 1, description: 'Dish ID' })
  dish_id: bigint;

  @ApiProperty({ example: 2, description: 'Quantity' })
  quantity: number;

  @ApiProperty({ example: 12.99, description: 'Price at order time' })
  price_at_order: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: 1, description: 'Customer ID', required: false })
  customer_id?: bigint;

  @ApiProperty({ example: 2, description: 'Staff ID', required: false })
  staff_id?: bigint;

  @ApiProperty({ example: 1, description: 'Table ID', required: false })
  table_id?: bigint;

  @ApiProperty({ example: 25.98, description: 'Total amount' })
  total_amount: number;

  @ApiProperty({ example: 0, description: 'Discount amount', required: false })
  discount_amount?: number;

  @ApiProperty({ example: 25.98, description: 'Final amount' })
  final_amount: number;

  @ApiProperty({ example: 'PENDING', description: 'Order Status' })
  status: string;

  @ApiProperty({
    type: [CreateOrderItemDto],
    description: 'List of ordered items',
  })
  items: CreateOrderItemDto[];
}
