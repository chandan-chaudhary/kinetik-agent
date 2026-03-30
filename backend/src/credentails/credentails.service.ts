import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PrismaService } from '@/database/prisma.service';
import { CredentialType } from '@prisma/client';
import credentialsConfig from '@/config/credentials.config';
import {
  deriveAesGcmKey,
  encryptAesGcm,
  decryptAesGcm,
} from '@/common/crypto.util';

@Injectable()
export class CredentailsService {
  private readonly encryptionKey: Buffer;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(credentialsConfig.KEY)
    private readonly credConfig: ConfigType<typeof credentialsConfig>,
  ) {
    this.encryptionKey = deriveAesGcmKey(this.credConfig.encryptionKey);
  }

  // Store
  async create(
    userId: string,
    dto: {
      name: string;
      type: string;
      data: Record<string, unknown>;
      isActive?: boolean;
    },
  ) {
    const encryptedData = this.encrypt(JSON.stringify(dto.data));

    return this.prisma.credential.create({
      data: {
        userId,
        name: dto.name.trim(),
        type: dto.type as CredentialType,
        data: encryptedData,
        isActive: dto.isActive ?? true,
      },
    });
  }

  // Retrieve — decrypt and return typed fields
  async findAll(userId: string, type?: CredentialType) {
    const rows = await this.prisma.credential.findMany({
      where: { userId, ...(type ? { type } : {}) },
      orderBy: { updatedAt: 'desc' },
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      // Return encrypted blob as-is for display (frontend decrypts for reveal)
      data: row.data,
      // Expose provider for display without decrypting everything
      preview: this.extractPreview(row.data, row.type),
    }));
  }

  async findOne(id: string, userId: string) {
    const row = await this.prisma.credential.findFirst({
      where: { id, userId },
    });
    if (!row) {
      throw new NotFoundException('Credential not found');
    }

    return {
      id: row.id,
      name: row.name,
      type: row.type,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      data: row.data,
      preview: this.extractPreview(row.data, row.type),
    };
  }

  async update(
    id: string,
    userId: string,
    dto: {
      name?: string;
      type?: CredentialType;
      data?: Record<string, unknown>;
      isActive?: boolean;
    },
  ) {
    const existing = await this.prisma.credential.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Credential not found');
    }

    const dataToStore = dto.data
      ? this.encrypt(JSON.stringify(dto.data))
      : undefined;

    const updated = await this.prisma.credential.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dataToStore !== undefined ? { data: dataToStore } : {}),
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      type: updated.type,
      isActive: updated.isActive,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      data: updated.data,
      preview: this.extractPreview(updated.data, updated.type),
    };
  }

  // Used internally by nodes — returns decrypted fields
  async resolveById(
    credentialId: string,
  ): Promise<Record<string, unknown> | null> {
    const row = await this.prisma.credential.findFirst({
      where: { id: credentialId, isActive: true },
    });
    if (!row) return null;

    try {
      return JSON.parse(this.decrypt(row.data)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  // Extract non-sensitive preview fields without full decrypt
  // Store a plaintext preview separately or decrypt just for provider
  private extractPreview(encryptedData: string, type: CredentialType): string {
    try {
      const data = JSON.parse(this.decrypt(encryptedData)) as Record<
        string,
        unknown
      >;

      const provider = typeof data.provider === 'string' ? data.provider : '';
      const model = typeof data.model === 'string' ? data.model : undefined;

      switch (type) {
        case 'LLM':
          return provider ? `${provider} / ${model ?? '—'}` : '';
        case 'DATABASE':
          return provider;
        case 'API_KEY':
          return provider;
        case 'TELEGRAM':
          return 'Telegram Bot';
        default:
          return '';
      }
    } catch {
      return '';
    }
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.credential.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Credential not found');
    }

    await this.prisma.credential.delete({ where: { id } });
    return { success: true };
  }

  private encrypt(value: string): string {
    return encryptAesGcm(value, this.encryptionKey);
  }

  private decrypt(value: string): string {
    const decrypted = decryptAesGcm(value, this.encryptionKey);
    if (decrypted === null) {
      throw new Error('Failed to decrypt credential data');
    }
    return decrypted;
  }
}
