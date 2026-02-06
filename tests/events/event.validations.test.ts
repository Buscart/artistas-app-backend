import { describe, it, expect } from '@jest/globals';
import { createEventSchema, updateEventSchema } from '../../src/controllers/events/event.validations.js';

describe('Event Validations', () => {
  describe('createEventSchema', () => {
    const validEventData = {
      title: 'Test Event',
      description: 'A test event description that is long enough', // Min 10 chars
      startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      endDate: new Date(Date.now() + 90000000).toISOString(), // Tomorrow + 1 hour
      locationType: 'physical' as const, // Use 'physical' not 'in_person'
      address: '123 Test Street',
      city: 'Test City',
      isFree: true,
    };

    it('should validate a correct event', () => {
      const result = createEventSchema.safeParse(validEventData);
      if (!result.success) {
        console.log('Validation errors:', result.error.issues);
      }
      expect(result.success).toBe(true);
    });

    it('should require title', () => {
      const data = { ...validEventData, title: '' };
      const result = createEventSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('title');
      }
    });

    it('should require description with min 10 chars', () => {
      const data = { ...validEventData, description: 'short' };
      const result = createEventSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject past start date', () => {
      const data = {
        ...validEventData,
        startDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      };
      const result = createEventSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject end date before start date', () => {
      const now = Date.now();
      const data = {
        ...validEventData,
        startDate: new Date(now + 86400000).toISOString(), // Tomorrow
        endDate: new Date(now + 3600000).toISOString(), // 1 hour from now (before start)
      };
      const result = createEventSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should require price for non-free events', () => {
      const data = {
        ...validEventData,
        isFree: false,
        ticketPrice: 0, // Invalid: should be > 0 for paid events
      };
      const result = createEventSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept valid price for paid events', () => {
      const data = {
        ...validEventData,
        isFree: false,
        ticketPrice: 50,
      };
      const result = createEventSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should require address for physical events', () => {
      const data = {
        ...validEventData,
        locationType: 'physical' as const,
        address: undefined,
        city: undefined,
        venueName: undefined,
      };
      const result = createEventSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should require URL for online events', () => {
      const data = {
        ...validEventData,
        locationType: 'online' as const,
        address: undefined,
        onlineEventUrl: undefined, // Required for online
      };
      const result = createEventSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept valid URL for online events', () => {
      const data = {
        ...validEventData,
        locationType: 'online' as const,
        address: undefined,
        onlineEventUrl: 'https://zoom.us/meeting/123',
      };
      const result = createEventSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate hybrid events with both address and URL', () => {
      const data = {
        ...validEventData,
        locationType: 'hybrid' as const,
        address: '123 Test Street',
        onlineEventUrl: 'https://zoom.us/meeting/123',
      };
      const result = createEventSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate capacity as positive number', () => {
      const data = {
        ...validEventData,
        capacity: -10, // Invalid
      };
      const result = createEventSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept valid capacity', () => {
      const data = {
        ...validEventData,
        capacity: 100,
      };
      const result = createEventSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('updateEventSchema', () => {
    it('should allow partial updates with id', () => {
      const data = {
        id: 1,
        title: 'Updated Title',
      };
      const result = updateEventSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should require id field', () => {
      const data = {
        title: 'Updated Title',
      };
      const result = updateEventSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should validate title if provided', () => {
      const data = {
        id: 1,
        title: '', // Invalid even in update (min 3 chars)
      };
      const result = updateEventSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should allow updating description', () => {
      const data = {
        id: 1,
        description: 'New description that is long enough',
      };
      const result = updateEventSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate dates if provided', () => {
      const data = {
        id: 1,
        startDate: new Date(Date.now() + 86400000).toISOString(),
        endDate: new Date(Date.now() + 90000000).toISOString(),
      };
      const result = updateEventSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject end date before start date in update', () => {
      const now = Date.now();
      const data = {
        id: 1,
        startDate: new Date(now + 86400000).toISOString(),
        endDate: new Date(now + 3600000).toISOString(), // before start
      };
      const result = updateEventSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
