import { Injectable, NotFoundException, Inject } from '@nestjs/common';
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

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  sql?: string;
  timestamp: string;
}

export interface CreateSessionDto {
  title?: string;
  dbType?: string;
  databaseUrl?: string;
}

export interface UpdateSessionDto {
  title?: string;
  messages?: ChatMessage[];
}

type ChatSessionOutput = Omit<ChatSession, 'databaseUrl' | 'messages'> & {
  databaseUrl: string | null;
  messages: ChatMessage[];
};

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
    const threadId = `chat_${uuidv4()}`;
    const session = await this.prisma.chatSession.create({
      data: {
        userId,
        title: dto.title || 'New Chat',
        threadId,
        dbType: dto.dbType || 'postgres',
        databaseUrl: dto.databaseUrl
          ? encryptAesGcm(dto.databaseUrl, this.encryptionKey)
          : null,
        messages: [] as Prisma.InputJsonValue,
      },
    });
    return this.toOutput(session);
  }

  async findAll(userId: string): Promise<ChatSessionOutput[]> {
    const sessions = await this.prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    return sessions.map((session) => this.toOutput(session));
  }

  async findOne(id: string, userId: string): Promise<ChatSessionOutput> {
    const session = await this.prisma.chatSession.findFirst({
      where: { id, userId },
    });
    if (!session) throw new NotFoundException('Chat session not found');
    return this.toOutput(session);
  }

  async findByThreadId(
    threadId: string,
    userId: string,
  ): Promise<ChatSessionOutput> {
    const session = await this.prisma.chatSession.findFirst({
      where: { threadId, userId },
    });
    if (!session) throw new NotFoundException('Chat session not found');
    return this.toOutput(session);
  }

  async appendMessage(
    id: string,
    userId: string,
    message: ChatMessage,
  ): Promise<ChatSessionOutput> {
    const session = await this.prisma.chatSession.findFirst({
      where: { id, userId },
    });
    if (!session) throw new NotFoundException('Chat session not found');

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
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateSessionDto,
  ): Promise<ChatSessionOutput> {
    const session = await this.prisma.chatSession.findFirst({
      where: { id, userId },
    });
    if (!session) throw new NotFoundException('Chat session not found');

    const updateData: Prisma.ChatSessionUpdateInput = {
      title: dto.title,
      messages: dto.messages
        ? (dto.messages as unknown as Prisma.InputJsonValue)
        : undefined,
    };

    const updated = await this.prisma.chatSession.update({
      where: { id },
      data: updateData,
    });
    return this.toOutput(updated);
  }

  async remove(id: string, userId: string) {
    const session = await this.prisma.chatSession.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!session) throw new NotFoundException('Chat session not found');
    await this.prisma.chatSession.delete({ where: { id } });
    return { success: true };
  }

  private toOutput(session: ChatSession): ChatSessionOutput {
    return {
      ...session,
      messages: this.parseMessages(session.messages),
      databaseUrl: session.databaseUrl
        ? decryptAesGcm(session.databaseUrl, this.encryptionKey)
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
