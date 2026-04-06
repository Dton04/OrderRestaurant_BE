import { TableRepository } from './table.repository';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { UpdateTableStatusDto } from './dto/update-table-status.dto';
import { OrderRepository } from '../order/order.repository';
import { EventsGateway } from '../events/events.gateway';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class TableService {
  constructor(
    private readonly tableRepository: TableRepository,
    private readonly orderRepository: OrderRepository,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async create(createTableDto: CreateTableDto) {
    return this.tableRepository.create(createTableDto);
  }

  async findAll() {
    return this.tableRepository.findAll();
  }

  async findOne(id: bigint) {
    const tableInfo = await this.tableRepository.findById(id);
    if (!tableInfo) {
      throw new NotFoundException('Table not found');
    }
    return tableInfo;
  }

  async update(id: bigint, updateTableDto: UpdateTableDto) {
    await this.findOne(id);
    return this.tableRepository.update(id, updateTableDto);
  }

  async remove(id: bigint) {
    await this.findOne(id);
    return this.tableRepository.delete(id);
  }

  async updateStatus(id: bigint, dto: UpdateTableStatusDto) {
    const table = await this.findOne(id);

    // Accidental protection: If status is being set to FREE or RESERVED,
    // ensure no non-deleted active orders exist.
    if (dto.status === 'FREE' || dto.status === 'RESERVED') {
      const hasActive = await this.orderRepository.hasActiveOrder(id);
      if (hasActive) {
        throw new BadRequestException(
          `Bàn này đang có đơn hàng chưa hoàn tất. Vui lòng thanh toán hoặc hủy đơn trước khi giải phóng bàn.`,
        );
      }
    }

    const updated = await this.tableRepository.update(id, { status: dto.status });
    
    // Real-time notification
    this.eventsGateway.notifyTableStatusChanged();
    
    return {
      message: 'Cập nhật trạng thái bàn thành công.',
      data: updated,
    };
  }
}
