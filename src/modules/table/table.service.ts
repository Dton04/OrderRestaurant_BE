import { Injectable, NotFoundException } from '@nestjs/common';
import { TableRepository } from './table.repository';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';

@Injectable()
export class TableService {
  constructor(private readonly tableRepository: TableRepository) {}

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
}
