import { Injectable, Inject, HttpStatus } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import credentialsConfig from '@/config/credentials.config';
import type { ConfigType } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import {
  Prisma,
  ChatSession,
  ChatMessage as PrismaChatMessage,
} from '@prisma/client';
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
import { CacheHelperService } from '@/redis/cache-helper.service';

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
  dbType?: DbType;
  databaseUrl?: string;
  llmCredentialId?: string;
  llmProvider?: LlmProvider;
  llmModel?: string;
  llmApiKey?: string;
}

type ChatSessionOutput = Omit<ChatSession, 'databaseUrl' | 'llmApiKey'> & {
  dbType: DbType;
  databaseUrl: string | null;
  llmCredentialId: string | null;
  llmProvider: LlmProvider | null;
  llmModel: string | null;
  llmApiKey: string | null;
  messages: ChatMessage[];
};

type ChatSessionWithMessages = ChatSession & {
  chatMessages: PrismaChatMessage[];
};

export type ChatSessionSummary = Pick<
  ChatSessionOutput,
  'id' | 'title' | 'threadId' | 'dbType' | 'createdAt' | 'updatedAt'
>;

@Injectable()
export class ChatSessionService {
  private readonly encryptionKey: Buffer;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheHelper: CacheHelperService,
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
        },
      });
      if (!session) {
        throw createError('Failed to create chat session', {
          httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        });
      }
      // Invalidate cache for the user's chat sessions list
      await this.cacheHelper.invalidateEntityCache({
        entity: 'chatSession',
        scope: [userId],
      });
      return this.toOutput({ ...session, chatMessages: [] });
    } catch (error) {
      throw customError(error, {
        fallbackStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        fallbackMessage: 'Failed to create chat session',
      });
    }
  }

  async findAll(userId: string): Promise<ChatSessionSummary[]> {
    try {
      const cacheKey = this.cacheHelper.buildEntityListKey('chatSession', [
        userId,
      ]);
      const cachedSession = await this.cacheHelper.get(cacheKey);
      if (cachedSession) {
        return cachedSession as ChatSessionSummary[];
      }
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
      // Cache the sessions list for the user
      const customizedSessions = sessions.map((session) => ({
        ...session,
        dbType: isDbType(session.dbType) ? session.dbType : DbType.POSTGRES,
      }));
      await this.cacheHelper.set(cacheKey, customizedSessions, 600); // Cache for 5 minutes
      return customizedSessions;
    } catch (error) {
      throw customError(error, {
        fallbackStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        fallbackMessage: 'Failed to retrieve chat sessions',
      });
    }
  }

  async findOne(id: string, userId: string): Promise<ChatSessionOutput> {
    try {
      const cacheKey = this.cacheHelper.buildEntityItemKey('chatSession', id, [
        userId,
      ]);
      const cachedSession = await this.cacheHelper.get(cacheKey);
      if (cachedSession) {
        return cachedSession as ChatSessionOutput;
      }
      const session = await this.prisma.chatSession.findFirst({
        where: { id, userId },
        include: {
          chatMessages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
      if (!session)
        throw createError('Chat session not found', {
          httpStatus: HttpStatus.NOT_FOUND,
        });
      const customizedSession = this.toOutput(session);
      await this.cacheHelper.set(cacheKey, customizedSession, 300); // Cache for 5 minutes
      return customizedSession;
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
      const cacheKey = this.cacheHelper.buildEntityListKey(
        'chatSession',
        [userId],
        { threadId },
      );
      const cachedSession = await this.cacheHelper.get(cacheKey);
      if (cachedSession) {
        return cachedSession as ChatSessionOutput;
      }
      const session = await this.prisma.chatSession.findFirst({
        where: { threadId, userId },
        include: {
          chatMessages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
      if (!session)
        throw createError('Chat session not found', {
          httpStatus: HttpStatus.NOT_FOUND,
        });
      const customizedSession = this.toOutput(session);
      await this.cacheHelper.set(cacheKey, customizedSession, 300); // Cache for 5 minutes
      return customizedSession;
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
      return this.appendMessages(id, userId, [message]);
    } catch (error) {
      throw customError(error, {
        fallbackStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        fallbackMessage: 'Failed to append message to chat session',
      });
    }
  }

  async appendMessages(
    id: string,
    userId: string,
    messages: ChatMessage[],
  ): Promise<ChatSessionOutput> {
    try {
      const session = await this.prisma.chatSession.findFirst({
        where: { id, userId },
        select: { id: true, threadId: true, title: true },
      });
      if (!session) {
        throw createError('Chat session not found', {
          httpStatus: HttpStatus.NOT_FOUND,
        });
      }

      if (messages.length > 0) {
        const createInputs: Prisma.ChatMessageCreateManyInput[] = messages.map(
          (message) => ({
            sessionId: id,
            role: message.role,
            content: message.content,
            sql: message.sql,
            createdAt: message.timestamp
              ? new Date(message.timestamp)
              : new Date(),
          }),
        );

        const firstUserMessage = messages.find((m) => m.role === 'user');
        await this.prisma.$transaction(async (tx) => {
          await tx.chatMessage.createMany({ data: createInputs });

          if (firstUserMessage && session.title === 'New Chat') {
            await tx.chatSession.update({
              where: { id },
              data: {
                title:
                  firstUserMessage.content.length > 50
                    ? `${firstUserMessage.content.slice(0, 50)}...`
                    : firstUserMessage.content,
              },
            });
          }
        });
      }

      // Invalidate cache for this chat session and the sessions list
      await this.cacheHelper.invalidateEntityCache({
        entity: 'chatSession',
        scope: [userId],
        id,
        listFilters: [{ threadId: session.threadId }],
      });

      const updatedSession = await this.prisma.chatSession.findFirst({
        where: { id, userId },
        include: {
          chatMessages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!updatedSession) {
        throw createError('Chat session not found', {
          httpStatus: HttpStatus.NOT_FOUND,
        });
      }

      return this.toOutput(updatedSession);
    } catch (error) {
      throw customError(error, {
        fallbackStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        fallbackMessage: 'Failed to append messages to chat session',
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
      };
      // Invalidate cache for this chat session and the sessions list
      await this.cacheHelper.invalidateEntityCache({
        entity: 'chatSession',
        scope: [userId],
        id,
        listFilters: [{ threadId: session.threadId }],
      });
      await this.prisma.chatSession.update({
        where: { id },
        data: updateData,
      });
      const updated = await this.prisma.chatSession.findFirst({
        where: { id, userId },
        include: {
          chatMessages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
      if (!updated) {
        throw createError('Chat session not found', {
          httpStatus: HttpStatus.NOT_FOUND,
        });
      }
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
        select: { id: true, threadId: true },
      });
      if (!session) {
        throw createError('Chat session not found', {
          httpStatus: HttpStatus.NOT_FOUND,
        });
      }
      await this.prisma.chatSession.delete({ where: { id } });
      await this.cacheHelper.invalidateEntityCache({
        entity: 'chatSession',
        scope: [userId],
        id,
        listFilters: [{ threadId: session.threadId }],
      });
      return { success: true };
    } catch (error) {
      throw customError(error, {
        fallbackStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        fallbackMessage: 'Failed to remove chat session',
      });
    }
  }

  private toOutput(session: ChatSessionWithMessages): ChatSessionOutput {
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
      messages: session.chatMessages.map((message) => ({
        role:
          message.role === 'user' ||
          message.role === 'assistant' ||
          message.role === 'system'
            ? message.role
            : 'system',
        content: message.content,
        sql: message.sql || undefined,
        timestamp: message.createdAt.toISOString(),
      })),
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
}
