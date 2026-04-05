import { Injectable, Inject, HttpStatus } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PrismaService } from '@/database/prisma.service';
import { CredentialType } from '@prisma/client';
import credentialsConfig from '@/config/credentials.config';
import { createError, customError, ERROR_CODE } from '@/common/customError';
import {
  deriveAesGcmKey,
  encryptAesGcm,
  decryptAesGcm,
} from '@/common/crypto.util';
import { CacheHelperService } from '@/redis/cache-helper.service';

type CredentialCacheItem = {
  id: string;
  name: string;
  type: CredentialType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  data: string;
  preview: string;
};

@Injectable()
export class CredentailsService {
  private readonly encryptionKey: Buffer;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheHelperService,
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
    try {
      const encryptedData = this.encrypt(JSON.stringify(dto.data));

      const credential = await this.prisma.credential.create({
        data: {
          userId,
          name: dto.name.trim(),
          type: dto.type as CredentialType,
          data: encryptedData,
          isActive: dto.isActive ?? true,
        },
      });
      if (!credential) {
        throw createError('Failed to create credential', {
          code: ERROR_CODE.INTERNAL_ERROR,
          httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        });
      }

      await this.cacheService.invalidateEntityCache({
        entity: 'credentials',
        scope: [userId],
        listFilters: [{ type: credential.type }],
      });

      return {
        id: credential.id,
        name: credential.name,
        type: credential.type,
        isActive: credential.isActive,
        createdAt: credential.createdAt,
        updatedAt: credential.updatedAt,
        data: credential.data,
        preview: this.extractPreview(credential.data, credential.type),
      };
    } catch (error) {
      throw customError(error, {
        fallbackStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        fallbackMessage: 'Failed to create credential',
      });
    }
  }

  // Retrieve — decrypt and return typed fields
  async findAll(userId: string, type?: CredentialType) {
    try {
      const cacheKey = type
        ? this.cacheService.buildEntityListKey('credentials', [userId], {
            type,
          })
        : this.cacheService.buildEntityListKey('credentials', [userId]);
      console.log(cacheKey, 'in findall');

      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        console.log('cached hit');

        return cached as CredentialCacheItem[];
      }
      console.log('cached miss');

      const rows = await this.prisma.credential.findMany({
        where: { userId, ...(type ? { type } : {}) },
        orderBy: { updatedAt: 'desc' },
      });
      if (!rows) {
        throw createError('Failed to retrieve credentials', {
          httpStatus: HttpStatus.NOT_FOUND,
        });
      }
      const credentials: CredentialCacheItem[] = rows.map((row) => ({
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
      await this.cacheService.set(cacheKey, credentials, 300); // Cache for 5 minutes
      return credentials;
    } catch (error) {
      throw customError(error, {
        fallbackStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        fallbackMessage: 'Failed to retrieve credentials',
      });
    }
  }

  async findOne(id: string, userId: string) {
    try {
      const cacheKey = this.cacheService.buildEntityItemKey('credentials', id, [
        userId,
      ]);
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return cached as CredentialCacheItem;
      }

      const row = await this.prisma.credential.findFirst({
        where: { id, userId },
      });
      if (!row) {
        throw createError('Credential not found', {
          httpStatus: HttpStatus.NOT_FOUND,
        });
      }

      const credential: CredentialCacheItem = {
        id: row.id,
        name: row.name,
        type: row.type,
        isActive: row.isActive,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        data: row.data,
        preview: this.extractPreview(row.data, row.type),
      };

      await this.cacheService.set(cacheKey, credential, 300);
      return credential;
    } catch (error) {
      throw customError(error, {
        fallbackStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        fallbackMessage: 'Failed to retrieve credential',
      });
    }
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
    try {
      const existing = await this.prisma.credential.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        throw createError('Credential not found', {
          httpStatus: HttpStatus.NOT_FOUND,
        });
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

      await this.cacheService.invalidateEntityCache({
        entity: 'credentials',
        scope: [userId],
        id,
        listFilters: [{ type: existing.type }, { type: updated.type }],
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
    } catch (error) {
      throw customError(error, {
        fallbackStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        fallbackMessage: 'Failed to update credential',
      });
    }
  }

  // Used internally by nodes — returns decrypted fields
  async resolveById(
    credentialId: string,
  ): Promise<Record<string, unknown> | null> {
    try {
      const row = await this.prisma.credential.findFirst({
        where: { id: credentialId, isActive: true },
      });
      if (!row) return null;

      try {
        return JSON.parse(this.decrypt(row.data)) as Record<string, unknown>;
      } catch {
        return null;
      }
    } catch (error) {
      throw customError(error, {
        fallbackStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        fallbackMessage: 'Failed to resolve credential',
      });
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
    try {
      const existing = await this.prisma.credential.findFirst({
        where: { id, userId },
        select: { id: true, type: true },
      });

      if (!existing) {
        throw createError('Credential not found', {
          code: ERROR_CODE.NOT_FOUND,
          httpStatus: HttpStatus.NOT_FOUND,
        });
      }

      await this.prisma.credential.delete({ where: { id } });
      await this.cacheService.invalidateEntityCache({
        entity: 'credentials',
        scope: [userId],
        id,
        listFilters: [{ type: existing.type }],
      });
      return { success: true };
    } catch (error) {
      throw customError(error, {
        fallbackStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        fallbackMessage: 'Failed to remove credential',
      });
    }
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
