import { Module } from '@nestjs/common';
import { TableService } from './table.service';
import { TableController } from './table.controller';
import { TableRepository } from './table.repository';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [OrderModule],
  controllers: [TableController],
  providers: [TableService, TableRepository],
  exports: [TableService],
})
export class TableModule {}
