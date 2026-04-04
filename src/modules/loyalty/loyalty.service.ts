import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';

export type LoyaltyRuleStatus = 'ACTIVE' | 'INACTIVE';
export type LoyaltyRewardStatus = 'ACTIVE' | 'INACTIVE';

export interface LoyaltyRule {
  id: string;
  name: string;
  pointsPerTransaction: number;
  minimumSpend: number;
  startDate: string;
  status: LoyaltyRuleStatus;
  updatedAt: string;
}

export interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  voucherTemplate: string;
  pointsRequired: number;
  redemptionCount: number;
  status: LoyaltyRewardStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyRedemptionHistory {
  id: string;
  userName: string;
  rewardName: string;
  pointsSpent: number;
  redeemedAt: string;
}

interface LoyaltyStorage {
  rules: LoyaltyRule[];
  rewards: LoyaltyReward[];
  history: LoyaltyRedemptionHistory[];
}

interface UpsertRuleInput {
  name: string;
  pointsPerTransaction: number;
  minimumSpend: number;
  startDate: string;
  status?: LoyaltyRuleStatus;
}

interface CreateRewardInput {
  name: string;
  description: string;
  voucherTemplate: string;
  pointsRequired: number;
}

interface UpdateRewardInput extends CreateRewardInput {
  status?: LoyaltyRewardStatus;
}

const createId = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;

const createDefaultStorage = (): LoyaltyStorage => ({
  rules: [
    {
      id: 'rule_welcome_gold',
      name: 'Standard Dining Points',
      pointsPerTransaction: 10,
      minimumSpend: 50,
      startDate: '2026-01-01',
      status: 'ACTIVE',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'rule_weekend_bonus',
      name: 'Weekend Premium Bonus',
      pointsPerTransaction: 20,
      minimumSpend: 120,
      startDate: '2026-02-15',
      status: 'ACTIVE',
      updatedAt: new Date().toISOString(),
    },
  ],
  rewards: [
    {
      id: 'reward_signature_discount',
      name: 'Signature 15% Voucher',
      description: '15% off the total bill for premium dining reservations.',
      voucherTemplate: 'LOYALTY-15-OFF',
      pointsRequired: 600,
      redemptionCount: 18,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'reward_private_room',
      name: 'Private Room Upgrade',
      description: 'Private room upgrade for one reservation session.',
      voucherTemplate: 'VIP-ROOM-UPGRADE',
      pointsRequired: 1500,
      redemptionCount: 6,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  history: [
    {
      id: 'history_1',
      userName: 'Annie Case',
      rewardName: 'Signature 15% Voucher',
      pointsSpent: 600,
      redeemedAt: '2026-03-21T10:15:00.000Z',
    },
    {
      id: 'history_2',
      userName: 'Marcus Lee',
      rewardName: 'Private Room Upgrade',
      pointsSpent: 1500,
      redeemedAt: '2026-03-18T18:30:00.000Z',
    },
    {
      id: 'history_3',
      userName: 'Sara Nguyen',
      rewardName: 'Signature 15% Voucher',
      pointsSpent: 600,
      redeemedAt: '2026-03-15T12:00:00.000Z',
    },
  ],
});

@Injectable()
export class LoyaltyService {
  private readonly storagePath = path.join(
    process.cwd(),
    'data',
    'loyalty-admin.json',
  );

  private async ensureStorage() {
    await fs.mkdir(path.dirname(this.storagePath), { recursive: true });
    try {
      await fs.access(this.storagePath);
    } catch {
      await this.writeStorage(createDefaultStorage());
    }
  }

  private async readStorage(): Promise<LoyaltyStorage> {
    await this.ensureStorage();
    const raw = await fs.readFile(this.storagePath, 'utf8');
    return JSON.parse(raw) as LoyaltyStorage;
  }

  private async writeStorage(data: LoyaltyStorage) {
    await fs.writeFile(this.storagePath, JSON.stringify(data, null, 2), 'utf8');
  }

  async getDashboard() {
    const storage = await this.readStorage();
    return {
      rules: storage.rules.sort((a, b) => b.startDate.localeCompare(a.startDate)),
      rewards: storage.rewards.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      history: storage.history.sort(
        (a, b) =>
          new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime(),
      ),
    };
  }

  async createRule(input: UpsertRuleInput) {
    const storage = await this.readStorage();
    const now = new Date().toISOString();
    const rule: LoyaltyRule = {
      id: createId('rule'),
      name: input.name,
      pointsPerTransaction: input.pointsPerTransaction,
      minimumSpend: input.minimumSpend,
      startDate: input.startDate,
      status: 'ACTIVE',
      updatedAt: now,
    };

    storage.rules.unshift(rule);
    await this.writeStorage(storage);
    return rule;
  }

  async updateRule(id: string, input: Partial<UpsertRuleInput>) {
    const storage = await this.readStorage();
    const index = storage.rules.findIndex((rule) => rule.id === id);
    if (index === -1) {
      throw new Error('Rule not found');
    }

    storage.rules[index] = {
      ...storage.rules[index],
      ...input,
      updatedAt: new Date().toISOString(),
    };
    await this.writeStorage(storage);
    return storage.rules[index];
  }

  async deactivateRule(id: string) {
    return this.updateRule(id, { status: 'INACTIVE' });
  }

  async createReward(input: CreateRewardInput) {
    const storage = await this.readStorage();
    const now = new Date().toISOString();
    const reward: LoyaltyReward = {
      id: createId('reward'),
      name: input.name,
      description: input.description,
      voucherTemplate: input.voucherTemplate,
      pointsRequired: input.pointsRequired,
      redemptionCount: 0,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };

    storage.rewards.unshift(reward);
    await this.writeStorage(storage);
    return reward;
  }

  async updateReward(id: string, input: Partial<UpdateRewardInput>) {
    const storage = await this.readStorage();
    const index = storage.rewards.findIndex((reward) => reward.id === id);
    if (index === -1) {
      throw new Error('Reward not found');
    }

    storage.rewards[index] = {
      ...storage.rewards[index],
      ...input,
      updatedAt: new Date().toISOString(),
    };
    await this.writeStorage(storage);
    return storage.rewards[index];
  }

  async deleteReward(id: string) {
    const storage = await this.readStorage();
    storage.rewards = storage.rewards.filter((reward) => reward.id !== id);
    await this.writeStorage(storage);
    return { success: true };
  }
}
