import { ApiProperty } from '@nestjs/swagger';

export class FinalizePaymentDto {
  @ApiProperty({ example: 100, description: 'Order ID' })
  order_id: bigint | number | string;

  @ApiProperty({ example: 500000, description: 'Amount paid' })
  amount: number;

  @ApiProperty({
    example: 'VNPAY',
    description: 'Payment method (CASH, CARD, VNPAY)',
  })
  method: string;

  @ApiProperty({
    example: 'TRANS123456',
    description: 'Transaction ID from provider',
    required: false,
  })
  transaction_id?: string;
}
