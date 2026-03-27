import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ example: 1, description: 'Order ID' })
  order_id: bigint;

  @ApiProperty({ example: 25.98, description: 'Amount paid' })
  amount: number;

  @ApiProperty({
    example: 'CARD',
    description: 'Payment method (CASH, CARD, MOMO, VNPAY)',
  })
  method: string;

  @ApiProperty({ example: 'SUCCESS', description: 'Payment status' })
  status: string;

  @ApiProperty({
    example: 'txn_123456789',
    description: 'Transaction ID from provider',
    required: false,
  })
  transaction_id?: string;
}
