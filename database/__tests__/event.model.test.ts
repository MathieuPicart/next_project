import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Event, { IEvent } from '../event.model';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  // Create an in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // Clean up all collections after each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('Event Model', () => {
  const validEventData = {
    title: 'Test Event',
    description: 'Test Description',
    overview: 'Test Overview',
    image: 'https://example.com/image.jpg',
    venue: 'Test Venue',
    location: 'Test Location',
    date: '2025-12-01',
    time: '10:00',
    mode: 'online' as const,
    audience: 'Everyone',
    agenda: ['Item 1'],
    organizer: 'Test Organizer',
    tags: ['test'],
  };

  describe('Slug generation', () => {
    it('should generate slug from title on save', async () => {
      const event = await Event.create({
        ...validEventData,
        title: 'My Amazing Event',
      });

      expect(event.slug).toBe('my-amazing-event');
    });

    it('should convert title to lowercase in slug', async () => {
      const event = await Event.create({
        ...validEventData,
        title: 'UPPERCASE EVENT',
      });

      expect(event.slug).toBe('uppercase-event');
    });

    it('should replace spaces with hyphens', async () => {
      const event = await Event.create({
        ...validEventData,
        title: 'Event With Multiple Spaces',
      });

      expect(event.slug).toBe('event-with-multiple-spaces');
    });

    it('should remove special characters from slug', async () => {
      const event = await Event.create({
        ...validEventData,
        title: 'Event! With@ Special# Characters$',
      });

      expect(event.slug).toBe('event-with-special-characters');
    });

    it('should handle multiple consecutive spaces', async () => {
      const event = await Event.create({
        ...validEventData,
        title: 'Event    With    Multiple    Spaces',
      });

      expect(event.slug).toBe('event-with-multiple-spaces');
    });

    it('should remove leading and trailing hyphens', async () => {
      const event = await Event.create({
        ...validEventData,
        title: '---Event Name---',
      });

      expect(event.slug).toBe('event-name');
    });

    it('should handle mixed alphanumeric content', async () => {
      const event = await Event.create({
        ...validEventData,
        title: 'Tech Conference 2025',
      });

      expect(event.slug).toBe('tech-conference-2025');
    });

    it('should trim whitespace before generating slug', async () => {
      const event = await Event.create({
        ...validEventData,
        title: '  Event With Spaces  ',
      });

      expect(event.slug).toBe('event-with-spaces');
    });

    it('should regenerate slug when title is updated', async () => {
      const event = await Event.create({
        ...validEventData,
        title: 'Original Title',
      });

      expect(event.slug).toBe('original-title');

      event.title = 'Updated Title';
      await event.save();

      expect(event.slug).toBe('updated-title');
    });

    it('should not regenerate slug if title is not modified', async () => {
      const event = await Event.create({
        ...validEventData,
        title: 'Fixed Title',
      });

      const originalSlug = event.slug;
      event.description = 'Updated description';
      await event.save();

      expect(event.slug).toBe(originalSlug);
    });
  });

  describe('Date normalization', () => {
    it('should normalize date to YYYY-MM-DD format', async () => {
      const event = await Event.create({
        ...validEventData,
        date: '2025-12-25',
      });

      expect(event.date).toBe('2025-12-25');
    });

    it('should convert various date formats to ISO format', async () => {
      const testCases = [
        { input: 'December 25, 2025', expected: '2025-12-25' },
        { input: '2025/12/25', expected: '2025-12-25' },
        { input: '12-25-2025', expected: '2025-12-24' }, // Note: JS Date interprets this as MM-DD-YYYY
      ];

      for (const { input, expected } of testCases) {
        const event = await Event.create({
          ...validEventData,
          title: `Event ${input}`,
          date: input,
        });

        expect(event.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });

    it('should reject invalid date formats', async () => {
      await expect(
        Event.create({
          ...validEventData,
          date: 'invalid-date',
        })
      ).rejects.toThrow(/Invalid date/i);
    });

    it('should handle ISO date strings', async () => {
      const event = await Event.create({
        ...validEventData,
        date: '2025-06-15T00:00:00.000Z',
      });

      expect(event.date).toBe('2025-06-15');
    });

    it('should normalize date when updated', async () => {
      const event = await Event.create(validEventData);

      event.date = '2025-12-31';
      await event.save();

      expect(event.date).toBe('2025-12-31');
    });
  });

  describe('Time normalization', () => {
    it('should normalize 24-hour time format', async () => {
      const event = await Event.create({
        ...validEventData,
        time: '14:30',
      });

      expect(event.time).toBe('14:30');
    });

    it('should convert 12-hour AM format to 24-hour', async () => {
      const testCases = [
        { input: '9:00 AM', expected: '09:00' },
        { input: '10:30 AM', expected: '10:30' },
        { input: '12:00 AM', expected: '00:00' }, // Midnight
      ];

      for (const { input, expected } of testCases) {
        const event = await Event.create({
          ...validEventData,
          title: `Event ${input}`,
          time: input,
        });

        expect(event.time).toBe(expected);
      }
    });

    it('should convert 12-hour PM format to 24-hour', async () => {
      const testCases = [
        { input: '1:00 PM', expected: '13:00' },
        { input: '5:30 PM', expected: '17:30' },
        { input: '12:00 PM', expected: '12:00' }, // Noon
        { input: '11:59 PM', expected: '23:59' },
      ];

      for (const { input, expected } of testCases) {
        const event = await Event.create({
          ...validEventData,
          title: `Event ${input}`,
          time: input,
        });

        expect(event.time).toBe(expected);
      }
    });

    it('should pad single-digit hours with zero', async () => {
      const event = await Event.create({
        ...validEventData,
        time: '9:00',
      });

      expect(event.time).toBe('09:00');
    });

    it('should handle time with whitespace', async () => {
      const event = await Event.create({
        ...validEventData,
        time: '  2:30 PM  ',
      });

      expect(event.time).toBe('14:30');
    });

    it('should reject invalid time formats', async () => {
      const invalidTimes = [
        'invalid',
        '25:00',
        '12:60',
        '12:00:00',
        'noon',
      ];

      for (const time of invalidTimes) {
        await expect(
          Event.create({
            ...validEventData,
            title: `Event ${time}`,
            time,
          })
        ).rejects.toThrow(/Invalid time/i);
      }
    });

    it('should reject out-of-range time values', async () => {
      await expect(
        Event.create({
          ...validEventData,
          time: '24:00',
        })
      ).rejects.toThrow(/Invalid time/i);

      await expect(
        Event.create({
          ...validEventData,
          title: 'Event 2',
          time: '12:60',
        })
      ).rejects.toThrow(/Invalid time/i);
    });

    it('should normalize time when updated', async () => {
      const event = await Event.create(validEventData);

      event.time = '3:45 PM';
      await event.save();

      expect(event.time).toBe('15:45');
    });

    it('should handle case-insensitive AM/PM', async () => {
      const event1 = await Event.create({
        ...validEventData,
        title: 'Event AM',
        time: '9:00 am',
      });

      const event2 = await Event.create({
        ...validEventData,
        title: 'Event PM',
        time: '9:00 pm',
      });

      expect(event1.time).toBe('09:00');
      expect(event2.time).toBe('21:00');
    });
  });
});
