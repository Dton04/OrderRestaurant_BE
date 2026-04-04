import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TableRepository } from './table.repository';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';

@Injectable()
export class TableService {
  constructor(private readonly tableRepository: TableRepository) {}

  async create(createTableDto: CreateTableDto) {
    if (!Number.isInteger(createTableDto.area_id)) {
      throw new BadRequestException('area_id must be an integer');
    }

    const areaId = BigInt(createTableDto.area_id);
    const area = await this.tableRepository.findAreaById(areaId);
    if (!area) {
      throw new NotFoundException('Area not found');
    }

    return this.tableRepository.create({
      table_number: createTableDto.table_number,
      capacity: createTableDto.capacity,
      status: createTableDto.status,
      area_id: areaId,
    });
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
    const data: Record<string, unknown> = {};
    if (updateTableDto.table_number !== undefined) data.table_number = updateTableDto.table_number;
    if (updateTableDto.capacity !== undefined) data.capacity = updateTableDto.capacity;
    if (updateTableDto.status !== undefined) data.status = updateTableDto.status;

    if (updateTableDto.area_id !== undefined) {
      if (!Number.isInteger(updateTableDto.area_id)) {
        throw new BadRequestException('area_id must be an integer');
      }
      const areaId = BigInt(updateTableDto.area_id);
      const area = await this.tableRepository.findAreaById(areaId);
      if (!area) {
        throw new NotFoundException('Area not found');
      }
      data.area_id = areaId;
    }

    return this.tableRepository.update(id, data);
  }

  async remove(id: bigint) {
    await this.findOne(id);
    return this.tableRepository.delete(id);
  }
}
