import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';

type KeyPart = string | number | boolean;
type EntityFilters = Record<string, string | number | boolean | undefined>;

@Injectable()
export class CacheHelperService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  buildKey(...parts: KeyPart[]): string {
    return parts
      .map((part) => String(part).trim())
      .filter(Boolean)
      .map((part) => this.normalizeSegment(part))
      .join(':');
  }

  buildKeyFromUrl(requestUrl: string): string {
    const parsed = new URL(requestUrl, 'http://cache.local');

    const pathSegments = parsed.pathname
      .split('/')
      .filter(Boolean)
      .map((segment) => this.normalizeSegment(segment));

    const querySegments = Array.from(parsed.searchParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) =>
        this.normalizeSegment(`${key}=${decodeURIComponent(value)}`),
      );

    return this.buildKey(...pathSegments, ...querySegments);
  }

  buildEntityKey(
    entity: string,
    id?: string | number,
    filters?: EntityFilters,
  ): string {
    const segments: KeyPart[] = [entity];

    if (id !== undefined) {
      segments.push(id);
    }

    if (filters) {
      const filterSegments = Object.entries(filters)
        .filter(([, value]) => value !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${String(value)}`);

      segments.push(...filterSegments);
    }

    return this.buildKey(...segments);
  }

  buildEntityListKey(
    entity: string,
    scope: KeyPart[] = [],
    filters?: EntityFilters,
  ): string {
    if (!filters || Object.keys(filters).length === 0) {
      return this.buildKey(entity, ...scope, 'all');
    }

    const filterParts = Object.entries(filters)
      .filter(([, value]) => value !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${String(value)}`);

    return this.buildKey(entity, ...scope, ...filterParts);
  }

  buildEntityItemKey(
    entity: string,
    id: string | number,
    scope: KeyPart[] = [],
  ): string {
    return this.buildKey(entity, ...scope, id);
  }

  async getOrSet<T>(
    key: string,
    loader: () => Promise<T>,
    ttlSeconds = 60,
  ): Promise<T> {
    const cached = await this.cacheManager.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const value = await loader();
    await this.cacheManager.set(key, value, ttlSeconds * 1000);
    return value;
  }

  async get(key: string): Promise<unknown> {
    return this.cacheManager.get(key);
  }

  async set(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
    await this.cacheManager.set(key, value, ttlSeconds * 1000);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async invalidateKey(key: string): Promise<void> {
    await this.del(key);
  }

  async invalidateKeys(keys: string[]): Promise<void> {
    const uniqueKeys = Array.from(new Set(keys.filter(Boolean)));
    await Promise.all(uniqueKeys.map((key) => this.del(key)));
  }

  async invalidateEntityCache(options: {
    entity: string;
    scope?: KeyPart[];
    id?: string | number;
    listFilters?: EntityFilters[];
    includeBaseList?: boolean;
  }): Promise<void> {
    const {
      entity,
      scope = [],
      id,
      listFilters = [],
      includeBaseList = true,
    } = options;

    const keys: string[] = [];

    if (id !== undefined) {
      keys.push(this.buildEntityItemKey(entity, id, scope));
    }

    if (includeBaseList) {
      keys.push(this.buildEntityListKey(entity, scope));
    }

    for (const filters of listFilters) {
      keys.push(this.buildEntityListKey(entity, scope, filters));
    }

    await this.invalidateKeys(keys);
  }

  private normalizeSegment(value: string): string {
    return value
      .trim()
      .replace(/^\/+|\/+$/g, '')
      .replace(/\s+/g, '-')
      .replace(/\//g, ':');
  }
}
