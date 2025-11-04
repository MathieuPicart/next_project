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

  describe('Required fields validation', () => {
    it('should reject event creation without title', async () => {
      const invalidEvent = { ...validEventData };
      delete (invalidEvent as any).title;

      await expect(Event.create(invalidEvent)).rejects.toThrow(/title.*required/i);
    });

    it('should reject event creation without description', async () => {
      const invalidEvent = { ...validEventData };
      delete (invalidEvent as any).description;

      await expect(Event.create(invalidEvent)).rejects.toThrow(/description.*required/i);
    });

    it('should reject event creation without overview', async () => {
      const invalidEvent = { ...validEventData };
      delete (invalidEvent as any).overview;

      await expect(Event.create(invalidEvent)).rejects.toThrow(/overview.*required/i);
    });

    it('should reject event creation without image', async () => {
      const invalidEvent = { ...validEventData };
      delete (invalidEvent as any).image;

      await expect(Event.create(invalidEvent)).rejects.toThrow(/image.*required/i);
    });

    it('should reject event creation without venue', async () => {
      const invalidEvent = { ...validEventData };
      delete (invalidEvent as any).venue;

      await expect(Event.create(invalidEvent)).rejects.toThrow(/venue.*required/i);
    });

    it('should reject event creation without location', async () => {
      const invalidEvent = { ...validEventData };
      delete (invalidEvent as any).location;

      await expect(Event.create(invalidEvent)).rejects.toThrow(/location.*required/i);
    });

    it('should reject event creation without date', async () => {
      const invalidEvent = { ...validEventData };
      delete (invalidEvent as any).date;

      await expect(Event.create(invalidEvent)).rejects.toThrow(/date.*required/i);
    });

    it('should reject event creation without time', async () => {
      const invalidEvent = { ...validEventData };
      delete (invalidEvent as any).time;

      await expect(Event.create(invalidEvent)).rejects.toThrow(/time.*required/i);
    });

    it('should reject event creation without mode', async () => {
      const invalidEvent = { ...validEventData };
      delete (invalidEvent as any).mode;

      await expect(Event.create(invalidEvent)).rejects.toThrow(/mode.*required/i);
    });

    it('should reject event creation without audience', async () => {
      const invalidEvent = { ...validEventData };
      delete (invalidEvent as any).audience;

      await expect(Event.create(invalidEvent)).rejects.toThrow(/audience.*required/i);
    });

    it('should reject event creation without agenda', async () => {
      const invalidEvent = { ...validEventData };
      delete (invalidEvent as any).agenda;

      await expect(Event.create(invalidEvent)).rejects.toThrow(/agenda.*required/i);
    });

    it('should reject event creation without organizer', async () => {
      const invalidEvent = { ...validEventData };
      delete (invalidEvent as any).organizer;

      await expect(Event.create(invalidEvent)).rejects.toThrow(/organizer.*required/i);
    });

    it('should reject event creation without tags', async () => {
      const invalidEvent = { ...validEventData };
      delete (invalidEvent as any).tags;

      await expect(Event.create(invalidEvent)).rejects.toThrow(/tags.*required/i);
    });
  });

  describe('Maxlength validations', () => {
    it('should reject title exceeding 100 characters', async () => {
      const longTitle = 'a'.repeat(101);

      await expect(
        Event.create({
          ...validEventData,
          title: longTitle,
        })
      ).rejects.toThrow(/title.*exceed.*100/i);
    });

    it('should accept title at exactly 100 characters', async () => {
      const maxTitle = 'a'.repeat(100);

      const event = await Event.create({
        ...validEventData,
        title: maxTitle,
      });

      expect(event.title).toHaveLength(100);
    });

    it('should reject description exceeding 1000 characters', async () => {
      const longDescription = 'a'.repeat(1001);

      await expect(
        Event.create({
          ...validEventData,
          description: longDescription,
        })
      ).rejects.toThrow(/description.*exceed.*1000/i);
    });

    it('should accept description at exactly 1000 characters', async () => {
      const maxDescription = 'a'.repeat(1000);

      const event = await Event.create({
        ...validEventData,
        description: maxDescription,
      });

      expect(event.description).toHaveLength(1000);
    });

    it('should reject overview exceeding 500 characters', async () => {
      const longOverview = 'a'.repeat(501);

      await expect(
        Event.create({
          ...validEventData,
          overview: longOverview,
        })
      ).rejects.toThrow(/overview.*exceed.*500/i);
    });

    it('should accept overview at exactly 500 characters', async () => {
      const maxOverview = 'a'.repeat(500);

      const event = await Event.create({
        ...validEventData,
        overview: maxOverview,
      });

      expect(event.overview).toHaveLength(500);
    });
  });

  describe('Trim functionality', () => {
    it('should trim whitespace from title', async () => {
      const event = await Event.create({
        ...validEventData,
        title: '  Trimmed Title  ',
      });

      expect(event.title).toBe('Trimmed Title');
    });

    it('should trim whitespace from description', async () => {
      const event = await Event.create({
        ...validEventData,
        description: '  Trimmed Description  ',
      });

      expect(event.description).toBe('Trimmed Description');
    });

    it('should trim whitespace from overview', async () => {
      const event = await Event.create({
        ...validEventData,
        overview: '  Trimmed Overview  ',
      });

      expect(event.overview).toBe('Trimmed Overview');
    });

    it('should trim whitespace from image URL', async () => {
      const event = await Event.create({
        ...validEventData,
        image: '  https://example.com/image.jpg  ',
      });

      expect(event.image).toBe('https://example.com/image.jpg');
    });

    it('should trim whitespace from venue', async () => {
      const event = await Event.create({
        ...validEventData,
        venue: '  Convention Center  ',
      });

      expect(event.venue).toBe('Convention Center');
    });

    it('should trim whitespace from location', async () => {
      const event = await Event.create({
        ...validEventData,
        location: '  New York, NY  ',
      });

      expect(event.location).toBe('New York, NY');
    });

    it('should trim whitespace from audience', async () => {
      const event = await Event.create({
        ...validEventData,
        audience: '  Developers and Engineers  ',
      });

      expect(event.audience).toBe('Developers and Engineers');
    });

    it('should trim whitespace from organizer', async () => {
      const event = await Event.create({
        ...validEventData,
        organizer: '  Tech Corp  ',
      });

      expect(event.organizer).toBe('Tech Corp');
    });
  });

  describe('Mode enum validation', () => {
    it('should accept "online" as valid mode', async () => {
      const event = await Event.create({
        ...validEventData,
        mode: 'online',
      });

      expect(event.mode).toBe('online');
    });

    it('should accept "offline" as valid mode', async () => {
      const event = await Event.create({
        ...validEventData,
        mode: 'offline',
      });

      expect(event.mode).toBe('offline');
    });

    it('should accept "hybrid" as valid mode', async () => {
      const event = await Event.create({
        ...validEventData,
        mode: 'hybrid',
      });

      expect(event.mode).toBe('hybrid');
    });

    it('should reject invalid mode values', async () => {
      await expect(
        Event.create({
          ...validEventData,
          mode: 'invalid-mode',
        })
      ).rejects.toThrow(/mode.*online.*offline.*hybrid/i);
    });

    it('should reject empty string as mode', async () => {
      await expect(
        Event.create({
          ...validEventData,
          mode: '',
        })
      ).rejects.toThrow();
    });

    it('should reject uppercase mode values', async () => {
      await expect(
        Event.create({
          ...validEventData,
          mode: 'ONLINE',
        })
      ).rejects.toThrow(/mode.*online.*offline.*hybrid/i);
    });
  });

  describe('Array field validations', () => {
    describe('Agenda validation', () => {
      it('should accept agenda with single item', async () => {
        const event = await Event.create({
          ...validEventData,
          agenda: ['Opening Remarks'],
        });

        expect(event.agenda).toHaveLength(1);
        expect(event.agenda[0]).toBe('Opening Remarks');
      });

      it('should accept agenda with multiple items', async () => {
        const agenda = [
          'Registration',
          'Keynote Speech',
          'Panel Discussion',
          'Networking',
        ];

        const event = await Event.create({
          ...validEventData,
          agenda,
        });

        expect(event.agenda).toHaveLength(4);
        expect(event.agenda).toEqual(agenda);
      });

      it('should reject empty agenda array', async () => {
        await expect(
          Event.create({
            ...validEventData,
            agenda: [],
          })
        ).rejects.toThrow(/agenda.*required/i);
      });

      it('should reject non-array agenda', async () => {
        await expect(
          Event.create({
            ...validEventData,
            agenda: 'Not an array' as any,
          })
        ).rejects.toThrow();
      });
    });

    describe('Tags validation', () => {
      it('should accept tags with single item', async () => {
        const event = await Event.create({
          ...validEventData,
          tags: ['technology'],
        });

        expect(event.tags).toHaveLength(1);
        expect(event.tags[0]).toBe('technology');
      });

      it('should accept tags with multiple items', async () => {
        const tags = ['technology', 'innovation', 'networking', 'development'];

        const event = await Event.create({
          ...validEventData,
          tags,
        });

        expect(event.tags).toHaveLength(4);
        expect(event.tags).toEqual(tags);
      });

      it('should reject empty tags array', async () => {
        await expect(
          Event.create({
            ...validEventData,
            tags: [],
          })
        ).rejects.toThrow(/tag.*required/i);
      });

      it('should reject non-array tags', async () => {
        await expect(
          Event.create({
            ...validEventData,
            tags: 'Not an array' as any,
          })
        ).rejects.toThrow();
      });
    });
  });

  describe('Slug uniqueness', () => {
    it('should enforce unique slugs', async () => {
      await Event.create({
        ...validEventData,
        title: 'Unique Event',
      });

      // Try to create another event with the same title (and thus same slug)
      await expect(
        Event.create({
          ...validEventData,
          title: 'Unique Event',
          description: 'Different description',
        })
      ).rejects.toThrow(/duplicate.*slug|unique/i);
    });

    it('should allow different titles to create different slugs', async () => {
      const event1 = await Event.create({
        ...validEventData,
        title: 'First Event',
      });

      const event2 = await Event.create({
        ...validEventData,
        title: 'Second Event',
      });

      expect(event1.slug).toBe('first-event');
      expect(event2.slug).toBe('second-event');
      expect(event1.slug).not.toBe(event2.slug);
    });

    it('should handle similar titles that generate different slugs', async () => {
      const event1 = await Event.create({
        ...validEventData,
        title: 'Event 2024',
      });

      const event2 = await Event.create({
        ...validEventData,
        title: 'Event 2025',
      });

      expect(event1.slug).toBe('event-2024');
      expect(event2.slug).toBe('event-2025');
    });
  });

  describe('Timestamps', () => {
    it('should automatically create createdAt timestamp', async () => {
      const event = await Event.create(validEventData);

      expect(event.createdAt).toBeDefined();
      expect(event.createdAt).toBeInstanceOf(Date);
    });

    it('should automatically create updatedAt timestamp', async () => {
      const event = await Event.create(validEventData);

      expect(event.updatedAt).toBeDefined();
      expect(event.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt when document is modified', async () => {
      const event = await Event.create(validEventData);
      const originalUpdatedAt = event.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      event.description = 'Updated description';
      await event.save();

      expect(event.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should not change createdAt when document is updated', async () => {
      const event = await Event.create(validEventData);
      const originalCreatedAt = event.createdAt;

      await new Promise((resolve) => setTimeout(resolve, 10));

      event.description = 'Updated description';
      await event.save();

      expect(event.createdAt.getTime()).toBe(originalCreatedAt.getTime());
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle event with minimal valid data', async () => {
      const minimalEvent = {
        title: 'E',
        description: 'D',
        overview: 'O',
        image: 'https://example.com/i.jpg',
        venue: 'V',
        location: 'L',
        date: '2025-01-01',
        time: '00:00',
        mode: 'online' as const,
        audience: 'A',
        agenda: ['A'],
        organizer: 'O',
        tags: ['T'],
      };

      const event = await Event.create(minimalEvent);

      expect(event.title).toBe('E');
      expect(event.description).toBe('D');
      expect(event.overview).toBe('O');
    });

    it('should handle event with maximum valid data', async () => {
      const maximalEvent = {
        title: 'a'.repeat(100),
        description: 'b'.repeat(1000),
        overview: 'c'.repeat(500),
        image: 'https://example.com/image.jpg',
        venue: 'Very Long Venue Name With Many Words',
        location: 'Very Long Location Name With City State and Country',
        date: '2025-12-31',
        time: '23:59',
        mode: 'hybrid' as const,
        audience: 'Everyone from beginners to experts',
        agenda: Array(20).fill('Agenda item'),
        organizer: 'Very Long Organization Name',
        tags: Array(20).fill('tag'),
      };

      const event = await Event.create(maximalEvent);

      expect(event.title).toHaveLength(100);
      expect(event.description).toHaveLength(1000);
      expect(event.overview).toHaveLength(500);
      expect(event.agenda).toHaveLength(20);
      expect(event.tags).toHaveLength(20);
    });

    it('should handle special characters in text fields', async () => {
      const event = await Event.create({
        ...validEventData,
        title: 'Event & Workshop: "Innovation" <2025>',
        description: 'Description with symbols: @#$%^&*()',
        venue: "O'Reilly Convention Center",
      });

      expect(event.title).toBe('Event & Workshop: "Innovation" <2025>');
      expect(event.description).toBe('Description with symbols: @#$%^&*()');
      expect(event.venue).toBe("O'Reilly Convention Center");
    });

    it('should handle unicode and emoji characters', async () => {
      const event = await Event.create({
        ...validEventData,
        title: 'Tech Conference 🚀 2025',
        description: 'Join us for an amazing event! 🎉🎊',
        location: 'São Paulo, Brasil',
      });

      expect(event.title).toContain('🚀');
      expect(event.description).toContain('🎉');
      expect(event.location).toBe('São Paulo, Brasil');
    });

    it('should handle date at year boundaries', async () => {
      const event = await Event.create({
        ...validEventData,
        date: '2025-01-01',
      });

      expect(event.date).toBe('2025-01-01');
    });

    it('should handle leap year dates', async () => {
      const event = await Event.create({
        ...validEventData,
        date: '2024-02-29',
      });

      expect(event.date).toBe('2024-02-29');
    });

    it('should handle midnight time', async () => {
      const event = await Event.create({
        ...validEventData,
        time: '00:00',
      });

      expect(event.time).toBe('00:00');
    });

    it('should handle end-of-day time', async () => {
      const event = await Event.create({
        ...validEventData,
        time: '23:59',
      });

      expect(event.time).toBe('23:59');
    });
  });
});