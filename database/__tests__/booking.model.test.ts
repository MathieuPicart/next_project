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
});
