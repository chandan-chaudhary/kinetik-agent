import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PrismaService } from '@/database/prisma.service';
import { CredentialType, Prisma } from '@prisma/client';
import credentialsConfig from '@/config/credentials.config';
import {
  deriveAesGcmKey,
  encryptAesGcm,
  decryptAesGcm,
} from '@/common/crypto.util';

type CredentialOutput = {
  id: string;
  userId: string;
  name: string;
  type: CredentialType;
  provider: string;
  model: string | null;
  metadata: unknown;
  isActive: boolean;
  hasApiKey: boolean;
  apiKey: string | null;
  createdAt: Date;
  updatedAt: Date;
};

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

  async create(
    userId: string,
    createCredentailDto: Prisma.CredentialCreateInput,
  ) {
    try {
      const payload = {
        ...createCredentailDto,
        name: createCredentailDto.name.trim(),
        provider: createCredentailDto.provider.trim().toLowerCase(),
        model: createCredentailDto.model?.trim() || null,
        apiKey: createCredentailDto.apiKey
          ? this.encryptApiKey(createCredentailDto.apiKey.trim())
          : null,
        metadata: createCredentailDto.metadata ?? {},
        isActive: createCredentailDto.isActive ?? true,
        userId,
      };

      if (payload.isActive) {
        await this.prisma.credential.updateMany({
          where: {
            userId,
            type: payload.type as CredentialType,
            provider: payload.provider,
          },
          data: { isActive: false },
        });
      }

      const created = await this.prisma.credential.create({
        data: {
          userId,
          name: payload.name,
          type: payload.type as CredentialType,
          provider: payload.provider,
          model: payload.model,
          apiKey: payload.apiKey,
          metadata: payload.metadata,
          isActive: payload.isActive,
        },
      });

      return this.toOutput(created);
    } catch (error) {
      console.error('Failed to create credential', error);
      throw new InternalServerErrorException('Failed to create credential');
    }
  }

  async findAll(userId: string, type?: CredentialType) {
    const credentials = await this.prisma.credential.findMany({
      where: {
        userId,
        ...(type ? { type } : {}),
      },
      orderBy: [{ updatedAt: 'desc' }],
    });

    return credentials.map((credential) => this.toOutput(credential));
  }

  async findOne(id: string, userId: string) {
    const credential = await this.prisma.credential.findFirst({
      where: { id, userId },
    });

    if (!credential) {
      throw new NotFoundException('Credential not found');
    }

    return this.toOutput(credential);
  }

  async update(
    id: string,
    userId: string,
    updateCredentailDto: Prisma.CredentialUpdateInput,
  ) {
    const existing = await this.prisma.credential.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Credential not found');
    }

    const nextType =
      (updateCredentailDto.type as CredentialType | undefined) ?? existing.type;

    // provider may be a string or StringFieldUpdateOperationsInput
    let nextProvider = existing.provider;
    if (updateCredentailDto.provider !== undefined) {
      if (typeof updateCredentailDto.provider === 'string') {
        nextProvider = updateCredentailDto.provider.trim().toLowerCase();
      } else if (
        typeof updateCredentailDto.provider === 'object' &&
        'set' in updateCredentailDto.provider &&
        typeof updateCredentailDto.provider.set === 'string'
      ) {
        nextProvider = updateCredentailDto.provider.set.trim().toLowerCase();
      }
    }

    const nextActive =
      typeof updateCredentailDto.isActive === 'boolean'
        ? updateCredentailDto.isActive
        : existing.isActive;

    if (nextActive) {
      await this.prisma.credential.updateMany({
        where: {
          userId,
          type: nextType,
          provider: nextProvider,
          id: { not: id },
        },
        data: { isActive: false },
      });
    }

    // Build update data safely for Prisma.CredentialUpdateInput
    const updateData: Prisma.CredentialUpdateInput = {};

    if (updateCredentailDto.name !== undefined) {
      if (typeof updateCredentailDto.name === 'string') {
        updateData.name = updateCredentailDto.name.trim();
      } else if (
        typeof updateCredentailDto.name === 'object' &&
        'set' in updateCredentailDto.name &&
        typeof updateCredentailDto.name.set === 'string'
      ) {
        updateData.name = { set: updateCredentailDto.name.set.trim() };
      } else {
        updateData.name = updateCredentailDto.name;
      }
    }

    if (updateCredentailDto.type !== undefined) {
      updateData.type = updateCredentailDto.type as CredentialType;
    }

    if (updateCredentailDto.provider !== undefined) {
      if (typeof updateCredentailDto.provider === 'string') {
        updateData.provider = updateCredentailDto.provider.trim().toLowerCase();
      } else if (
        typeof updateCredentailDto.provider === 'object' &&
        'set' in updateCredentailDto.provider &&
        typeof updateCredentailDto.provider.set === 'string'
      ) {
        updateData.provider = {
          set: updateCredentailDto.provider.set.trim().toLowerCase(),
        };
      } else {
        updateData.provider = updateCredentailDto.provider;
      }
    }

    if (updateCredentailDto.model !== undefined) {
      if (typeof updateCredentailDto.model === 'string') {
        updateData.model = updateCredentailDto.model.trim() || null;
      } else if (
        typeof updateCredentailDto.model === 'object' &&
        updateCredentailDto.model !== null &&
        'set' in updateCredentailDto.model &&
        typeof updateCredentailDto.model.set === 'string'
      ) {
        updateData.model = {
          set: updateCredentailDto.model.set.trim() || null,
        };
      } else {
        updateData.model = updateCredentailDto.model;
      }
    }

    if (updateCredentailDto.apiKey !== undefined) {
      if (typeof updateCredentailDto.apiKey === 'string') {
        updateData.apiKey = updateCredentailDto.apiKey
          ? this.encryptApiKey(updateCredentailDto.apiKey.trim())
          : null;
      } else if (
        typeof updateCredentailDto.apiKey === 'object' &&
        updateCredentailDto.apiKey !== null &&
        'set' in updateCredentailDto.apiKey &&
        typeof updateCredentailDto.apiKey.set === 'string'
      ) {
        updateData.apiKey = {
          set: updateCredentailDto.apiKey.set
            ? this.encryptApiKey(updateCredentailDto.apiKey.set.trim())
            : null,
        };
      } else {
        updateData.apiKey = updateCredentailDto.apiKey;
      }
    }

    if (updateCredentailDto.metadata !== undefined) {
      updateData.metadata = updateCredentailDto.metadata;
    }

    if (updateCredentailDto.isActive !== undefined) {
      updateData.isActive = updateCredentailDto.isActive;
    }

    const updated = await this.prisma.credential.update({
      where: { id },
      data: updateData,
    });

    return this.toOutput(updated);
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

  async resolveById(credentialId: string) {
    const credential = await this.prisma.credential.findFirst({
      where: {
        id: credentialId,
        isActive: true,
      },
    });

    if (!credential) return null;

    return {
      ...credential,
      apiKey: this.decryptApiKey(credential.apiKey),
    };
  }

  async resolveActiveByProvider(
    userId: string,
    provider: string,
    type: CredentialType,
  ) {
    const credential = await this.prisma.credential.findFirst({
      where: {
        userId,
        provider: provider.trim().toLowerCase(),
        type,
        isActive: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!credential) return null;

    return {
      ...credential,
      apiKey: this.decryptApiKey(credential.apiKey),
    };
  }

  // Convert database credential to output format, encrypting the API key if it exists. The API key is encrypted in the format iv:ciphertext:authTag, all base64-encoded.
  private toOutput(credential: {
    id: string;
    userId: string;
    name: string;
    type: CredentialType;
    provider: string;
    model: string | null;
    apiKey: string | null;
    metadata: unknown;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): CredentialOutput {
    let apiKeyToSend: string | null = null;

    if (credential.apiKey) {
      const parts = credential.apiKey.split(':');
      // If already encrypted (iv:cipher:tag), forward as-is; otherwise encrypt on the fly
      apiKeyToSend =
        parts.length === 3
          ? credential.apiKey
          : this.encryptApiKey(credential.apiKey);
    }

    return {
      id: credential.id,
      userId: credential.userId,
      name: credential.name,
      type: credential.type,
      provider: credential.provider,
      model: credential.model,
      metadata: credential.metadata,
      isActive: credential.isActive,
      hasApiKey: Boolean(credential.apiKey),
      apiKey: apiKeyToSend,
      createdAt: credential.createdAt,
      updatedAt: credential.updatedAt,
    };
  }

  // Encrypt API keys before storing and decrypt when retrieving. The encryption format is iv:ciphertext:authTag, all base64-encoded.
  private encryptApiKey(apiKey: string): string {
    return encryptAesGcm(apiKey, this.encryptionKey);
  }

  // Decrypt API keys when retrieving from the database. If decryption fails, return null to avoid exposing the encrypted value.
  private decryptApiKey(apiKey?: string | null): string | null {
    if (!apiKey) return null;

    const parts = apiKey.split(':');
    if (parts.length !== 3) return apiKey; // backwards-compatible: plain text stored previously

    const decrypted = decryptAesGcm(apiKey, this.encryptionKey);
    if (decrypted === null) {
      console.error('Failed to decrypt API key');
    }
    return decrypted;
  }
}
