import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoryRepository } from './category.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async create(createCategoryDto: CreateCategoryDto) {
    return this.categoryRepository.create(createCategoryDto);
  }

  async findAll() {
    return this.categoryRepository.findAll();
  }

  async findOne(id: bigint) {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException('Danh mục không tồn tại');
    }
    return category;
  }

  async update(id: bigint, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(id);
    return this.categoryRepository.update(id, updateCategoryDto);
  }

  async remove(id: bigint) {
    await this.findOne(id);
    return this.categoryRepository.delete(id);
  }
}
