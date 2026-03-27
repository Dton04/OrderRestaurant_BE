import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async create(createUserDto: any, roleId: bigint) {
    const existingEmail = await this.userRepository.findByEmail(
      createUserDto.email,
    );
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    if (createUserDto.phone) {
      const existingPhone = await this.userRepository.findByPhone(
        createUserDto.phone,
      );
      if (existingPhone) {
        throw new ConflictException('Phone already exists');
      }
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const dataToSave = {
      ...createUserDto,
      password: hashedPassword,
      role_id: roleId,
    };

    return this.userRepository.create(dataToSave);
  }

  async findAll() {
    return this.userRepository.findAll();
  }

  async findByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }

  async findByPhone(phone: string) {
    return this.userRepository.findByPhone(phone);
  }

  async findRoleByName(name: string) {
    return this.userRepository.findRoleByName(name);
  }

  async findOne(id: bigint) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: bigint, updateUserDto: UpdateUserDto) {
    await this.findOne(id);
    return this.userRepository.update(id, updateUserDto);
  }

  async remove(id: bigint) {
    await this.findOne(id);
    return this.userRepository.delete(id);
  }
}
