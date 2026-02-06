import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { cacheService, CacheKeys, CacheTTL } from '../../src/services/cache.service.js';

describe('Cache Service', () => {
  beforeEach(() => {
    // Limpiar caché antes de cada test
    cacheService.flush();
  });

  describe('Basic Operations', () => {
    it('should set and get a value', () => {
      const key = 'test-key';
      const value = { data: 'test-value' };

      cacheService.set(key, value);
      const result = cacheService.get(key);

      expect(result).toEqual(value);
    });

    it('should return undefined for non-existent key', () => {
      const result = cacheService.get('non-existent');
      expect(result).toBeUndefined();
    });

    it('should check if key exists', () => {
      const key = 'test-key';
      cacheService.set(key, 'value');

      expect(cacheService.has(key)).toBe(true);
      expect(cacheService.has('non-existent')).toBe(false);
    });

    it('should delete a key', () => {
      const key = 'test-key';
      cacheService.set(key, 'value');

      expect(cacheService.has(key)).toBe(true);
      cacheService.del(key);
      expect(cacheService.has(key)).toBe(false);
    });

    it('should delete multiple keys', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');
      cacheService.set('key3', 'value3');

      cacheService.del(['key1', 'key2']);

      expect(cacheService.has('key1')).toBe(false);
      expect(cacheService.has('key2')).toBe(false);
      expect(cacheService.has('key3')).toBe(true);
    });

    it('should flush all keys', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');

      cacheService.flush();

      expect(cacheService.has('key1')).toBe(false);
      expect(cacheService.has('key2')).toBe(false);
    });
  });

  describe('TTL Behavior', () => {
    it('should expire key after TTL', async () => {
      const key = 'expiring-key';
      // Set with 1 second TTL
      cacheService.set(key, 'value', 1);

      expect(cacheService.get(key)).toBe('value');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(cacheService.get(key)).toBeUndefined();
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      const key = 'cached-key';
      const cachedValue = { cached: true };
      cacheService.set(key, cachedValue);

      const fetchFn = jest.fn().mockResolvedValue({ fresh: true });

      const result = await cacheService.getOrSet(key, fetchFn);

      expect(result).toEqual(cachedValue);
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('should fetch and cache value if not exists', async () => {
      const key = 'fresh-key';
      const freshValue = { fresh: true };
      const fetchFn = jest.fn().mockResolvedValue(freshValue);

      const result = await cacheService.getOrSet(key, fetchFn);

      expect(result).toEqual(freshValue);
      expect(fetchFn).toHaveBeenCalledTimes(1);
      expect(cacheService.get(key)).toEqual(freshValue);
    });
  });

  describe('Invalidation Helpers', () => {
    it('should invalidate event-related keys', () => {
      const eventId = 123;
      cacheService.set(CacheKeys.EVENT_BY_ID(eventId), 'event-data');
      cacheService.set(CacheKeys.EVENT_ATTENDEES(eventId), 'attendees-data');
      cacheService.set(CacheKeys.ATTENDEE_STATS(eventId), 'stats-data');
      cacheService.set(CacheKeys.EVENT_REVIEWS(eventId), 'reviews-data');
      cacheService.set(CacheKeys.EVENTS_UPCOMING, 'upcoming-data');

      cacheService.invalidateEvent(eventId);

      expect(cacheService.has(CacheKeys.EVENT_BY_ID(eventId))).toBe(false);
      expect(cacheService.has(CacheKeys.EVENT_ATTENDEES(eventId))).toBe(false);
      expect(cacheService.has(CacheKeys.ATTENDEE_STATS(eventId))).toBe(false);
      expect(cacheService.has(CacheKeys.EVENT_REVIEWS(eventId))).toBe(false);
      expect(cacheService.has(CacheKeys.EVENTS_UPCOMING)).toBe(false);
    });

    it('should invalidate user events keys', () => {
      const userId = 'user-123';
      cacheService.set(CacheKeys.EVENTS_BY_USER(userId), 'my-events');
      cacheService.set(CacheKeys.EVENTS_REGISTERED(userId), 'registered');
      cacheService.set(CacheKeys.EVENTS_ATTENDED(userId), 'attended');

      cacheService.invalidateUserEvents(userId);

      expect(cacheService.has(CacheKeys.EVENTS_BY_USER(userId))).toBe(false);
      expect(cacheService.has(CacheKeys.EVENTS_REGISTERED(userId))).toBe(false);
      expect(cacheService.has(CacheKeys.EVENTS_ATTENDED(userId))).toBe(false);
    });

    it('should invalidate event attendees keys', () => {
      const eventId = 456;
      cacheService.set(CacheKeys.EVENT_ATTENDEES(eventId), 'attendees');
      cacheService.set(CacheKeys.ATTENDEE_STATS(eventId), 'stats');

      cacheService.invalidateEventAttendees(eventId);

      expect(cacheService.has(CacheKeys.EVENT_ATTENDEES(eventId))).toBe(false);
      expect(cacheService.has(CacheKeys.ATTENDEE_STATS(eventId))).toBe(false);
    });
  });

  describe('Cache Keys', () => {
    it('should generate correct cache keys', () => {
      expect(CacheKeys.EVENT_BY_ID(123)).toBe('event:123');
      expect(CacheKeys.EVENTS_BY_USER('user-1')).toBe('events:user:user-1');
      expect(CacheKeys.EVENTS_REGISTERED('user-1')).toBe('events:registered:user-1');
      expect(CacheKeys.EVENTS_ATTENDED('user-1')).toBe('events:attended:user-1');
      expect(CacheKeys.EVENT_ATTENDEES(123)).toBe('attendees:event:123');
      expect(CacheKeys.ATTENDEE_STATS(123)).toBe('attendees:stats:123');
      expect(CacheKeys.EVENT_REVIEWS(123)).toBe('reviews:event:123');
    });
  });

  describe('Cache Statistics', () => {
    it('should return cache statistics', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');
      cacheService.get('key1'); // hit
      cacheService.get('non-existent'); // miss

      const stats = cacheService.getStats();

      expect(stats).toBeDefined();
      expect(stats.keys).toBe(2);
      expect(stats.hits).toBeGreaterThanOrEqual(1);
      expect(stats.misses).toBeGreaterThanOrEqual(1);
    });
  });
});
