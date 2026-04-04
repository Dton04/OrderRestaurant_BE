import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { PrismaService } from '../../common/prisma/prisma.service';

type VoucherStatus = 'ACTIVE' | 'EXPIRED' | 'DRAFT';
type UsageType = 'UNLIMITED' | 'LIMITED';

interface VoucherMeta {
  description: string;
  usageType: UsageType;
  usageLimit: number | null;
  usageCount: number;
  isDraft: boolean;
}

interface VoucherMetaStore {
  [voucherId: string]: VoucherMeta;
}

interface CreateVoucherInput {
  code?: string;
  discount_type: string;
  value: number;
  min_order_value: number;
  start_date: string;
  end_date: string;
  description?: string;
  usageType?: UsageType;
  usageLimit?: number | null;
}

type UpdateVoucherInput = Partial<CreateVoucherInput> & {
  usageCount?: number;
  isDraft?: boolean;
};

const autoCode = () =>
  `VCH-${Math.random().toString(36).slice(2, 6).toUpperCase()}${Date.now()
    .toString()
    .slice(-4)}`;

@Injectable()
export class VoucherService {
  private readonly metaPath = path.join(
    process.cwd(),
    'data',
    'voucher-admin-meta.json',
  );

  constructor(private readonly prisma: PrismaService) {}

  private async ensureMetaStore() {
    await fs.mkdir(path.dirname(this.metaPath), { recursive: true });
    try {
      await fs.access(this.metaPath);
    } catch {
      await fs.writeFile(this.metaPath, JSON.stringify({}, null, 2), 'utf8');
    }
  }

  private async readMetaStore(): Promise<VoucherMetaStore> {
    await this.ensureMetaStore();
    const raw = await fs.readFile(this.metaPath, 'utf8');
    return JSON.parse(raw) as VoucherMetaStore;
  }

  private async writeMetaStore(store: VoucherMetaStore) {
    await fs.writeFile(this.metaPath, JSON.stringify(store, null, 2), 'utf8');
  }

  private buildStatus(
    startDate: Date,
    endDate: Date,
    isDraft: boolean,
  ): VoucherStatus {
    if (isDraft) {
      return 'DRAFT';
    }

    const now = new Date();
    if (endDate.getTime() < now.getTime()) {
      return 'EXPIRED';
    }

    if (startDate.getTime() <= now.getTime()) {
      return 'ACTIVE';
    }

    return 'DRAFT';
  }

  private mergeVoucher(voucher: any, meta?: VoucherMeta) {
    const startDate = new Date(voucher.start_date);
    const endDate = new Date(voucher.end_date);
    const safeMeta: VoucherMeta = meta || {
      description: '',
      usageType: 'UNLIMITED',
      usageLimit: null,
      usageCount: 0,
      isDraft: false,
    };

    return {
      id: voucher.id.toString(),
      code: voucher.code,
      discount_type: voucher.discount_type,
      value: Number(voucher.value),
      min_order_value: Number(voucher.min_order_value),
      start_date: voucher.start_date,
      end_date: voucher.end_date,
      description: safeMeta.description,
      usageType: safeMeta.usageType,
      usageLimit: safeMeta.usageLimit,
      usageCount: safeMeta.usageCount,
      status: this.buildStatus(startDate, endDate, safeMeta.isDraft),
    };
  }

  async findAll(search?: string, status?: VoucherStatus) {
    const [vouchers, metaStore] = await Promise.all([
      this.prisma.voucher.findMany({
        where: { deleted_at: null },
        orderBy: { created_at: 'desc' },
      }),
      this.readMetaStore(),
    ]);

    const merged = vouchers.map((voucher) =>
      this.mergeVoucher(voucher, metaStore[voucher.id.toString()]),
    );

    return merged.filter((voucher) => {
      const matchesSearch = search
        ? voucher.code.toLowerCase().includes(search.toLowerCase())
        : true;
      const matchesStatus = status ? voucher.status === status : true;
      return matchesSearch && matchesStatus;
    });
  }

  async create(input: CreateVoucherInput) {
    const created = await this.prisma.voucher.create({
      data: {
        code: input.code?.trim() || autoCode(),
        discount_type: input.discount_type,
        value: input.value,
        min_order_value: input.min_order_value,
        start_date: new Date(input.start_date),
        end_date: new Date(input.end_date),
      },
    });

    const store = await this.readMetaStore();
    store[created.id.toString()] = {
      description: input.description || '',
      usageType: input.usageType || 'UNLIMITED',
      usageLimit:
        input.usageType === 'LIMITED' ? Number(input.usageLimit || 0) : null,
      usageCount: 0,
      isDraft: false,
    };
    await this.writeMetaStore(store);

    return this.mergeVoucher(created, store[created.id.toString()]);
  }

  async update(id: string, input: UpdateVoucherInput) {
    const updated = await this.prisma.voucher.update({
      where: { id: BigInt(id) },
      data: {
        code: input.code,
        discount_type: input.discount_type,
        value: input.value,
        min_order_value: input.min_order_value,
        start_date: input.start_date ? new Date(input.start_date) : undefined,
        end_date: input.end_date ? new Date(input.end_date) : undefined,
      },
    });

    const store = await this.readMetaStore();
    const previous = store[id] || {
      description: '',
      usageType: 'UNLIMITED',
      usageLimit: null,
      usageCount: 0,
      isDraft: false,
    };

    store[id] = {
      description: input.description ?? previous.description,
      usageType: input.usageType ?? previous.usageType,
      usageLimit:
        (input.usageType ?? previous.usageType) === 'LIMITED'
          ? Number(input.usageLimit ?? previous.usageLimit ?? 0)
          : null,
      usageCount: input.usageCount ?? previous.usageCount,
      isDraft: input.isDraft ?? previous.isDraft,
    };
    await this.writeMetaStore(store);

    return this.mergeVoucher(updated, store[id]);
  }

  async remove(id: string) {
    await this.prisma.voucher.update({
      where: { id: BigInt(id) },
      data: { deleted_at: new Date() },
    });

    const store = await this.readMetaStore();
    delete store[id];
    await this.writeMetaStore(store);

    return { success: true };
  }
}
