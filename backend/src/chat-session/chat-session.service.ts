import { Injectable, Inject, HttpStatus } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import credentialsConfig from '@/config/credentials.config';
import type { ConfigType } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { Prisma, ChatSession } from '@prisma/client';
import {
  deriveAesGcmKey,
  encryptAesGcm,
  decryptAesGcm,
} from '@/common/crypto.util';
import {
  DbType,
  type LlmProvider,
  isDbType,
  isLlmProvider,
} from '@/types/chat-config.types';
import { createError, customError } from '@/common/customError';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  sql?: string;
  timestamp: string;
}

export interface CreateSessionDto {
  title?: string;
  dbType?: DbType;
  databaseUrl?: string;
  llmCredentialId?: string;
  llmProvider?: LlmProvider;
  llmModel?: string;
  llmApiKey?: string;
}

export interface UpdateSessionDto {
  title?: string;
  messages?: ChatMessage[];
  dbType?: DbType;
  databaseUrl?: string;
  llmCredentialId?: string;
  llmProvider?: LlmProvider;
  llmModel?: string;
  llmApiKey?: string;
}

type ChatSessionOutput = Omit<
  ChatSession,
  'databaseUrl' | 'llmApiKey' | 'messages'
> & {
  dbType: DbType;
  databaseUrl: string | null;
  llmCredentialId: string | null;
  llmProvider: LlmProvider | null;
  llmModel: string | null;
  llmApiKey: string | null;
  messages: ChatMessage[];
};

export type ChatSessionSummary = Pick<
  ChatSessionOutput,
  | 'id'
  | 'title'
  | 'threadId'
  | 'dbType'
  // | 'llmCredentialId'
  // | 'llmProvider'
  // | 'llmModel'
  | 'createdAt'
  | 'updatedAt'
>;

@Injectable()
export class ChatSessionService {
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
    dto: CreateSessionDto,
  ): Promise<ChatSessionOutput> {
    try {
      const threadId = `chat_${uuidv4()}`;
      const session = await this.prisma.chatSession.create({
        data: {
          userId,
          title: dto.title || 'New Chat',
          threadId,
          dbType: dto.dbType || DbType.POSTGRES,
          databaseUrl: dto.databaseUrl
            ? encryptAesGcm(dto.databaseUrl, this.encryptionKey)
            : null,
          llmCredentialId: dto.llmCredentialId || null,
          llmProvider: dto.llmProvider || null,
          llmModel: dto.llmModel || null,
          llmApiKey: dto.llmApiKey
            ? encryptAesGcm(dto.llmApiKey, this.encryptionKey)
            : null,
          messages: [] as Prisma.InputJsonValue,
        },
      });
      if (!session) {
        throw createError('Failed to create chat session', {
          httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        });
      }
      return this.toOutput(session);
    } catch (error) {
      throw customError(error, {
        fallbackStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        fallbackMessage: 'Failed to create chat session',
      });
    }
  }

  async findAll(userId: string): Promise<ChatSessionSummary[]> {
    try {
      const sessions = await this.prisma.chatSession.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          threadId: true,
          dbType: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
      });
      if (!sessions) {
        throw createError('Failed to retrieve chat sessions', {
          httpStatus: HttpStatus.NOT_FOUND,
        });
      }
      return sessions.map((session) => ({
        ...session,
        dbType: isDbType(session.dbType) ? session.dbType : DbType.POSTGRES,
      }));
    } catch (error) {
      throw customError(error, {
        fallbackStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        fallbackMessage: 'Failed to retrieve chat sessions',
      });
    }
  }

  async findOne(id: string, userId: string): Promise<ChatSessionOutput> {
    try {
      const session = await this.prisma.chatSession.findFirst({
        where: { id, userId },
      });
      if (!session)
        throw createError('Chat session not found', {
          httpStatus: HttpStatus.NOT_FOUND,
        });
      return this.toOutput(session);
    } catch (error) {
      throw customError(error, {
        fallbackStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        fallbackMessage: 'Failed to retrieve chat session',
      });
    }
  }

  async findByThreadId(
    threadId: string,
    userId: string,
  ): Promise<ChatSessionOutput> {
    try {
      const session = await this.prisma.chatSession.findFirst({
        where: { threadId, userId },
      });
      if (!session)
        throw createError('Chat session not found', {
          httpStatus: HttpStatus.NOT_FOUND,
        });
      return this.toOutput(session);
    } catch (error) {
      throw customError(error, {
        fallbackStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        fallbackMessage: 'Failed to retrieve chat session by thread ID',
      });
    }
  }

  async appendMessage(
    id: string,
    userId: string,
    message: ChatMessage,
  ): Promise<ChatSessionOutput> {
    try {
      const session = await this.prisma.chatSession.findFirst({
        where: { id, userId },
      });
      if (!session) {
        throw createError('Chat session not found', {
          httpStatus: HttpStatus.NOT_FOUND,
        });
      }

      const messages = this.parseMessages(session.messages);
      messages.push(message);

      // Auto-generate title from first user message
      const isFirstUserMessage =
        message.role === 'user' &&
        messages.filter((m) => m.role === 'user').length === 1;

      const updateData: Prisma.ChatSessionUpdateInput = {
        messages: messages as unknown as Prisma.InputJsonValue,
      };
      if (isFirstUserMessage) {
        updateData.title =
          message.content.length > 50
            ? `${message.content.slice(0, 50)}...`
            : message.content;
      }

      const updated = await this.prisma.chatSession.update({
        where: { id },
        data: updateData,
      });
      return this.toOutput(updated);
    } catch (error) {
      throw customError(error, {
        fallbackStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        fallbackMessage: 'Failed to append message to chat session',
      });
    }
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateSessionDto,
  ): Promise<ChatSessionOutput> {
    try {
      const session = await this.prisma.chatSession.findFirst({
        where: { id, userId },
      });
      if (!session) {
        throw createError('Chat session not found', {
          httpStatus: HttpStatus.NOT_FOUND,
        });
      }

      const updateData: Prisma.ChatSessionUpdateInput = {
        title: dto.title,
        dbType: dto.dbType,
        databaseUrl:
          dto.databaseUrl !== undefined
            ? dto.databaseUrl
              ? encryptAesGcm(dto.databaseUrl, this.encryptionKey)
              : null
            : undefined,
        llmCredentialId: dto.llmCredentialId,
        llmProvider:
          dto.llmProvider !== undefined ? dto.llmProvider || null : undefined,
        llmModel: dto.llmModel !== undefined ? dto.llmModel || null : undefined,
        llmApiKey:
          dto.llmApiKey !== undefined
            ? dto.llmApiKey
              ? encryptAesGcm(dto.llmApiKey, this.encryptionKey)
              : null
            : undefined,
        messages: dto.messages
          ? (dto.messages as unknown as Prisma.InputJsonValue)
          : undefined,
      };

      const updated = await this.prisma.chatSession.update({
        where: { id },
        data: updateData,
      });
      return this.toOutput(updated);
    } catch (error) {
      throw customError(error, {
        fallbackStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        fallbackMessage: 'Failed to update chat session',
      });
    }
  }

  async remove(id: string, userId: string) {
    try {
      const session = await this.prisma.chatSession.findFirst({
        where: { id, userId },
        select: { id: true },
      });
      if (!session) {
        throw createError('Chat session not found', {
          httpStatus: HttpStatus.NOT_FOUND,
        });
      }
      await this.prisma.chatSession.delete({ where: { id } });
      return { success: true };
    } catch (error) {
      throw customError(error, {
        fallbackStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        fallbackMessage: 'Failed to remove chat session',
      });
    }
  }

  private toOutput(session: ChatSession): ChatSessionOutput {
    const sessionRecord = session as unknown as Record<string, unknown>;
    const llmCredentialId =
      typeof sessionRecord.llmCredentialId === 'string'
        ? sessionRecord.llmCredentialId
        : null;
    const llmProvider = isLlmProvider(sessionRecord.llmProvider)
      ? sessionRecord.llmProvider
      : null;
    const dbType = isDbType(session.dbType) ? session.dbType : DbType.POSTGRES;
    const llmModel =
      typeof sessionRecord.llmModel === 'string'
        ? sessionRecord.llmModel
        : null;
    const llmApiKey =
      typeof sessionRecord.llmApiKey === 'string'
        ? sessionRecord.llmApiKey
        : null;

    return {
      ...session,
      dbType,
      messages: this.parseMessages(session.messages),
      databaseUrl: session.databaseUrl
        ? decryptAesGcm(session.databaseUrl, this.encryptionKey)
        : null,
      llmCredentialId,
      llmProvider,
      llmModel,
      llmApiKey: llmApiKey
        ? decryptAesGcm(llmApiKey, this.encryptionKey)
        : null,
    };
  }

  private parseMessages(value: Prisma.JsonValue | null): ChatMessage[] {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => {
        if (
          item &&
          typeof item === 'object' &&
          'role' in item &&
          'content' in item &&
          'timestamp' in item
        ) {
          const candidate = item as unknown as Partial<ChatMessage>;
          if (
            (candidate.role === 'user' ||
              candidate.role === 'assistant' ||
              candidate.role === 'system') &&
            typeof candidate.content === 'string' &&
            typeof candidate.timestamp === 'string'
          ) {
            return candidate;
          }
        }
        return null;
      })
      .filter((m): m is ChatMessage => Boolean(m));
  }
}
