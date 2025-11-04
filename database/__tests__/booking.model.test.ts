import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Booking, { IBooking } from '../booking.model';
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

describe('Booking Model', () => {
  describe('Email validation', () => {
    let testEvent: IEvent;

    beforeEach(async () => {
      // Create a test event for booking
      testEvent = await Event.create({
        title: 'Test Event',
        description: 'Test Description',
        overview: 'Test Overview',
        image: 'https://example.com/image.jpg',
        venue: 'Test Venue',
        location: 'Test Location',
        date: '2025-12-01',
        time: '10:00',
        mode: 'online',
        audience: 'Everyone',
        agenda: ['Item 1'],
        organizer: 'Test Organizer',
        tags: ['test'],
      });
    });

    it('should accept valid email formats', async () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user_name@example.com',
        'test123@test-domain.com',
      ];

      for (const email of validEmails) {
        const booking = await Booking.create({
          eventId: testEvent._id,
          email,
        });
        expect(booking.email).toBe(email.toLowerCase());
      }
    });

    it('should reject invalid email formats', async () => {
      const invalidEmails = [
        'invalid',
        'invalid@',
        '@example.com',
        'invalid@.com',
        'invalid..email@example.com',
        'invalid @example.com',
        'invalid@example',
      ];

      for (const email of invalidEmails) {
        await expect(
          Booking.create({
            eventId: testEvent._id,
            email,
          })
        ).rejects.toThrow(/email/i);
      }
    });

    it('should normalize email to lowercase', async () => {
      const booking = await Booking.create({
        eventId: testEvent._id,
        email: 'TEST@EXAMPLE.COM',
      });
      expect(booking.email).toBe('test@example.com');
    });

    it('should trim whitespace from email', async () => {
      const booking = await Booking.create({
        eventId: testEvent._id,
        email: '  test@example.com  ',
      });
      expect(booking.email).toBe('test@example.com');
    });
  });

  describe('Event existence validation', () => {
    it('should prevent booking creation if eventId does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      await expect(
        Booking.create({
          eventId: nonExistentId,
          email: 'test@example.com',
        })
      ).rejects.toThrow(/does not exist/i);
    });

    it('should allow booking creation if eventId exists', async () => {
      const event = await Event.create({
        title: 'Valid Event',
        description: 'Test Description',
        overview: 'Test Overview',
        image: 'https://example.com/image.jpg',
        venue: 'Test Venue',
        location: 'Test Location',
        date: '2025-12-01',
        time: '10:00',
        mode: 'online',
        audience: 'Everyone',
        agenda: ['Item 1'],
        organizer: 'Test Organizer',
        tags: ['test'],
      });

      const booking = await Booking.create({
        eventId: event._id,
        email: 'test@example.com',
      });

      expect(booking.eventId.toString()).toBe(event._id.toString());
    });

    it('should reject invalid eventId format', async () => {
      await expect(
        Booking.create({
          eventId: 'invalid-id' as any,
          email: 'test@example.com',
        })
      ).rejects.toThrow();
    });
  });

  describe('Unique booking per event per email', () => {
    let testEvent: IEvent;

    beforeEach(async () => {
      testEvent = await Event.create({
        title: 'Unique Test Event',
        description: 'Test Description',
        overview: 'Test Overview',
        image: 'https://example.com/image.jpg',
        venue: 'Test Venue',
        location: 'Test Location',
        date: '2025-12-01',
        time: '10:00',
        mode: 'online',
        audience: 'Everyone',
        agenda: ['Item 1'],
        organizer: 'Test Organizer',
        tags: ['test'],
      });
    });

    it('should prevent duplicate bookings for same event and email', async () => {
      // Create first booking
      await Booking.create({
        eventId: testEvent._id,
        email: 'test@example.com',
      });

      // Attempt to create duplicate booking
      await expect(
        Booking.create({
          eventId: testEvent._id,
          email: 'test@example.com',
        })
      ).rejects.toThrow(/duplicate|unique/i);
    });

    it('should allow same email to book different events', async () => {
      const event2 = await Event.create({
        title: 'Another Event',
        description: 'Test Description',
        overview: 'Test Overview',
        image: 'https://example.com/image.jpg',
        venue: 'Test Venue',
        location: 'Test Location',
        date: '2025-12-02',
        time: '11:00',
        mode: 'offline',
        audience: 'Everyone',
        agenda: ['Item 1'],
        organizer: 'Test Organizer',
        tags: ['test'],
      });

      const booking1 = await Booking.create({
        eventId: testEvent._id,
        email: 'test@example.com',
      });

      const booking2 = await Booking.create({
        eventId: event2._id,
        email: 'test@example.com',
      });

      expect(booking1.email).toBe(booking2.email);
      expect(booking1.eventId.toString()).not.toBe(booking2.eventId.toString());
    });

    it('should allow different emails to book same event', async () => {
      const booking1 = await Booking.create({
        eventId: testEvent._id,
        email: 'user1@example.com',
      });

      const booking2 = await Booking.create({
        eventId: testEvent._id,
        email: 'user2@example.com',
      });

      expect(booking1.eventId.toString()).toBe(booking2.eventId.toString());
      expect(booking1.email).not.toBe(booking2.email);
    });

    it('should treat email comparison as case-insensitive for uniqueness', async () => {
      await Booking.create({
        eventId: testEvent._id,
        email: 'test@example.com',
      });

      // Should fail because emails are normalized to lowercase
      await expect(
        Booking.create({
          eventId: testEvent._id,
          email: 'TEST@EXAMPLE.COM',
        })
      ).rejects.toThrow(/duplicate|unique/i);
    });
  });

  describe('Timestamps', () => {
    let testEvent: IEvent;

    beforeEach(async () => {
      testEvent = await Event.create({
        title: 'Timestamp Test Event',
        description: 'Test Description',
        overview: 'Test Overview',
        image: 'https://example.com/image.jpg',
        venue: 'Test Venue',
        location: 'Test Location',
        date: '2025-12-01',
        time: '10:00',
        mode: 'online',
        audience: 'Everyone',
        agenda: ['Item 1'],
        organizer: 'Test Organizer',
        tags: ['test'],
      });
    });

    it('should automatically create createdAt timestamp', async () => {
      const booking = await Booking.create({
        eventId: testEvent._id,
        email: 'timestamp@example.com',
      });

      expect(booking.createdAt).toBeDefined();
      expect(booking.createdAt).toBeInstanceOf(Date);
    });

    it('should automatically create updatedAt timestamp', async () => {
      const booking = await Booking.create({
        eventId: testEvent._id,
        email: 'timestamp@example.com',
      });

      expect(booking.updatedAt).toBeDefined();
      expect(booking.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt when document is modified', async () => {
      const booking = await Booking.create({
        eventId: testEvent._id,
        email: 'timestamp@example.com',
      });

      const originalUpdatedAt = booking.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      booking.email = 'updated@example.com';
      await booking.save();

      expect(booking.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should not change createdAt when document is updated', async () => {
      const booking = await Booking.create({
        eventId: testEvent._id,
        email: 'timestamp@example.com',
      });

      const originalCreatedAt = booking.createdAt;

      await new Promise((resolve) => setTimeout(resolve, 10));

      booking.email = 'updated2@example.com';
      await booking.save();

      expect(booking.createdAt.getTime()).toBe(originalCreatedAt.getTime());
    });

    it('should have createdAt and updatedAt equal on creation', async () => {
      const booking = await Booking.create({
        eventId: testEvent._id,
        email: 'timestamp@example.com',
      });

      expect(booking.createdAt.getTime()).toBe(booking.updatedAt.getTime());
    });
  });

  describe('Required fields validation', () => {
    let testEvent: IEvent;

    beforeEach(async () => {
      testEvent = await Event.create({
        title: 'Required Fields Test',
        description: 'Test Description',
        overview: 'Test Overview',
        image: 'https://example.com/image.jpg',
        venue: 'Test Venue',
        location: 'Test Location',
        date: '2025-12-01',
        time: '10:00',
        mode: 'online',
        audience: 'Everyone',
        agenda: ['Item 1'],
        organizer: 'Test Organizer',
        tags: ['test'],
      });
    });

    it('should reject booking without eventId', async () => {
      await expect(
        Booking.create({
          email: 'test@example.com',
        } as any)
      ).rejects.toThrow(/eventId.*required/i);
    });

    it('should reject booking without email', async () => {
      await expect(
        Booking.create({
          eventId: testEvent._id,
        } as any)
      ).rejects.toThrow(/email.*required/i);
    });

    it('should reject booking with null eventId', async () => {
      await expect(
        Booking.create({
          eventId: null,
          email: 'test@example.com',
        } as any)
      ).rejects.toThrow();
    });

    it('should reject booking with null email', async () => {
      await expect(
        Booking.create({
          eventId: testEvent._id,
          email: null,
        } as any)
      ).rejects.toThrow();
    });

    it('should reject booking with undefined eventId', async () => {
      await expect(
        Booking.create({
          eventId: undefined,
          email: 'test@example.com',
        } as any)
      ).rejects.toThrow();
    });

    it('should reject booking with undefined email', async () => {
      await expect(
        Booking.create({
          eventId: testEvent._id,
          email: undefined,
        } as any)
      ).rejects.toThrow();
    });
  });

  describe('Edge cases and boundary conditions', () => {
    let testEvent: IEvent;

    beforeEach(async () => {
      testEvent = await Event.create({
        title: 'Edge Case Test Event',
        description: 'Test Description',
        overview: 'Test Overview',
        image: 'https://example.com/image.jpg',
        venue: 'Test Venue',
        location: 'Test Location',
        date: '2025-12-01',
        time: '10:00',
        mode: 'online',
        audience: 'Everyone',
        agenda: ['Item 1'],
        organizer: 'Test Organizer',
        tags: ['test'],
      });
    });

    it('should handle very long email addresses', async () => {
      const longEmail = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com';

      const booking = await Booking.create({
        eventId: testEvent._id,
        email: longEmail,
      });

      expect(booking.email).toBe(longEmail.toLowerCase());
    });

    it('should handle email with multiple subdomains', async () => {
      const booking = await Booking.create({
        eventId: testEvent._id,
        email: 'user@mail.subdomain.example.com',
      });

      expect(booking.email).toBe('user@mail.subdomain.example.com');
    });

    it('should handle email with special characters in local part', async () => {
      const specialEmails = [
        'user.name+tag@example.com',
        'user_name@example.com',
        'user-name@example.com',
        'first.last@example.com',
      ];

      for (const email of specialEmails) {
        const booking = await Booking.create({
          eventId: testEvent._id,
          email,
        });
        expect(booking.email).toBe(email.toLowerCase());
        await Booking.deleteOne({ _id: booking._id });
      }
    });

    it('should handle email with numbers', async () => {
      const booking = await Booking.create({
        eventId: testEvent._id,
        email: 'user123@example456.com',
      });

      expect(booking.email).toBe('user123@example456.com');
    });

    it('should handle international domain names (ASCII)', async () => {
      const booking = await Booking.create({
        eventId: testEvent._id,
        email: 'user@example.co.uk',
      });

      expect(booking.email).toBe('user@example.co.uk');
    });

    it('should handle single character local part', async () => {
      const booking = await Booking.create({
        eventId: testEvent._id,
        email: 'a@example.com',
      });

      expect(booking.email).toBe('a@example.com');
    });

    it('should reject email with double dots', async () => {
      await expect(
        Booking.create({
          eventId: testEvent._id,
          email: 'user..name@example.com',
        })
      ).rejects.toThrow(/email/i);
    });

    it('should reject email starting with dot', async () => {
      await expect(
        Booking.create({
          eventId: testEvent._id,
          email: '.user@example.com',
        })
      ).rejects.toThrow(/email/i);
    });

    it('should reject email ending with dot', async () => {
      await expect(
        Booking.create({
          eventId: testEvent._id,
          email: 'user.@example.com',
        })
      ).rejects.toThrow(/email/i);
    });

    it('should reject email with spaces', async () => {
      await expect(
        Booking.create({
          eventId: testEvent._id,
          email: 'user name@example.com',
        })
      ).rejects.toThrow(/email/i);
    });

    it('should reject email without TLD', async () => {
      await expect(
        Booking.create({
          eventId: testEvent._id,
          email: 'user@example',
        })
      ).rejects.toThrow(/email/i);
    });

    it('should handle maximum whitespace trimming', async () => {
      const booking = await Booking.create({
        eventId: testEvent._id,
        email: '          user@example.com          ',
      });

      expect(booking.email).toBe('user@example.com');
    });

    it('should handle tabs and newlines in email', async () => {
      const booking = await Booking.create({
        eventId: testEvent._id,
        email: '\t\nuser@example.com\n\t',
      });

      expect(booking.email).toBe('user@example.com');
    });
  });

  describe('Event reference validation', () => {
    it('should maintain reference to event after booking creation', async () => {
      const event = await Event.create({
        title: 'Reference Test Event',
        description: 'Test Description',
        overview: 'Test Overview',
        image: 'https://example.com/image.jpg',
        venue: 'Test Venue',
        location: 'Test Location',
        date: '2025-12-01',
        time: '10:00',
        mode: 'online',
        audience: 'Everyone',
        agenda: ['Item 1'],
        organizer: 'Test Organizer',
        tags: ['test'],
      });

      const booking = await Booking.create({
        eventId: event._id,
        email: 'reference@example.com',
      });

      expect(booking.eventId.toString()).toBe(event._id.toString());

      // Verify event still exists
      const foundEvent = await Event.findById(event._id);
      expect(foundEvent).toBeTruthy();
    });

    it('should handle multiple bookings for same event', async () => {
      const event = await Event.create({
        title: 'Multiple Bookings Event',
        description: 'Test Description',
        overview: 'Test Overview',
        image: 'https://example.com/image.jpg',
        venue: 'Test Venue',
        location: 'Test Location',
        date: '2025-12-01',
        time: '10:00',
        mode: 'online',
        audience: 'Everyone',
        agenda: ['Item 1'],
        organizer: 'Test Organizer',
        tags: ['test'],
      });

      const booking1 = await Booking.create({
        eventId: event._id,
        email: 'user1@example.com',
      });

      const booking2 = await Booking.create({
        eventId: event._id,
        email: 'user2@example.com',
      });

      const booking3 = await Booking.create({
        eventId: event._id,
        email: 'user3@example.com',
      });

      const bookings = await Booking.find({ eventId: event._id });
      expect(bookings).toHaveLength(3);
    });

    it('should handle booking update with valid eventId', async () => {
      const event1 = await Event.create({
        title: 'Event 1',
        description: 'Test Description',
        overview: 'Test Overview',
        image: 'https://example.com/image.jpg',
        venue: 'Test Venue',
        location: 'Test Location',
        date: '2025-12-01',
        time: '10:00',
        mode: 'online',
        audience: 'Everyone',
        agenda: ['Item 1'],
        organizer: 'Test Organizer',
        tags: ['test'],
      });

      const event2 = await Event.create({
        title: 'Event 2',
        description: 'Test Description',
        overview: 'Test Overview',
        image: 'https://example.com/image.jpg',
        venue: 'Test Venue',
        location: 'Test Location',
        date: '2025-12-02',
        time: '11:00',
        mode: 'online',
        audience: 'Everyone',
        agenda: ['Item 1'],
        organizer: 'Test Organizer',
        tags: ['test'],
      });

      const booking = await Booking.create({
        eventId: event1._id,
        email: 'update@example.com',
      });

      booking.eventId = event2._id;
      await booking.save();

      expect(booking.eventId.toString()).toBe(event2._id.toString());
    });

    it('should prevent booking update with non-existent eventId', async () => {
      const event = await Event.create({
        title: 'Initial Event',
        description: 'Test Description',
        overview: 'Test Overview',
        image: 'https://example.com/image.jpg',
        venue: 'Test Venue',
        location: 'Test Location',
        date: '2025-12-01',
        time: '10:00',
        mode: 'online',
        audience: 'Everyone',
        agenda: ['Item 1'],
        organizer: 'Test Organizer',
        tags: ['test'],
      });

      const booking = await Booking.create({
        eventId: event._id,
        email: 'update@example.com',
      });

      const nonExistentId = new mongoose.Types.ObjectId();
      booking.eventId = nonExistentId;

      await expect(booking.save()).rejects.toThrow(/does not exist/i);
    });
  });

  describe('Query performance and indexing', () => {
    let testEvent: IEvent;

    beforeEach(async () => {
      testEvent = await Event.create({
        title: 'Index Test Event',
        description: 'Test Description',
        overview: 'Test Overview',
        image: 'https://example.com/image.jpg',
        venue: 'Test Venue',
        location: 'Test Location',
        date: '2025-12-01',
        time: '10:00',
        mode: 'online',
        audience: 'Everyone',
        agenda: ['Item 1'],
        organizer: 'Test Organizer',
        tags: ['test'],
      });
    });

    it('should efficiently find bookings by eventId', async () => {
      // Create multiple bookings
      await Booking.create({
        eventId: testEvent._id,
        email: 'user1@example.com',
      });

      await Booking.create({
        eventId: testEvent._id,
        email: 'user2@example.com',
      });

      const bookings = await Booking.find({ eventId: testEvent._id });
      expect(bookings).toHaveLength(2);
    });

    it('should efficiently find bookings by email', async () => {
      const event2 = await Event.create({
        title: 'Event 2',
        description: 'Test Description',
        overview: 'Test Overview',
        image: 'https://example.com/image.jpg',
        venue: 'Test Venue',
        location: 'Test Location',
        date: '2025-12-02',
        time: '11:00',
        mode: 'online',
        audience: 'Everyone',
        agenda: ['Item 1'],
        organizer: 'Test Organizer',
        tags: ['test'],
      });

      await Booking.create({
        eventId: testEvent._id,
        email: 'consistent@example.com',
      });

      await Booking.create({
        eventId: event2._id,
        email: 'consistent@example.com',
      });

      const bookings = await Booking.find({ email: 'consistent@example.com' });
      expect(bookings).toHaveLength(2);
    });

    it('should efficiently find bookings by compound index (eventId + createdAt)', async () => {
      await Booking.create({
        eventId: testEvent._id,
        email: 'user1@example.com',
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      await Booking.create({
        eventId: testEvent._id,
        email: 'user2@example.com',
      });

      const bookings = await Booking.find({ eventId: testEvent._id }).sort({ createdAt: -1 });
      expect(bookings).toHaveLength(2);
      expect(bookings[0].email).toBe('user2@example.com');
      expect(bookings[1].email).toBe('user1@example.com');
    });
  });
});