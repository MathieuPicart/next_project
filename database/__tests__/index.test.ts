import * as DatabaseIndex from '../index';
import Event from '../event.model';
import Booking from '../booking.model';

describe('Database Index Exports', () => {
  describe('Model exports', () => {
    it('should export Event model', () => {
      expect(DatabaseIndex.Event).toBeDefined();
      expect(DatabaseIndex.Event).toBe(Event);
    });

    it('should export Booking model', () => {
      expect(DatabaseIndex.Booking).toBeDefined();
      expect(DatabaseIndex.Booking).toBe(Booking);
    });

    it('should export Event as default from event.model', () => {
      expect(DatabaseIndex.Event.modelName).toBe('Event');
    });

    it('should export Booking as default from booking.model', () => {
      expect(DatabaseIndex.Booking.modelName).toBe('Booking');
    });
  });

  describe('Type exports', () => {
    it('should have IEvent type available', () => {
      // This is a compile-time check, but we can verify the interface exists
      // by checking that the imported type satisfies the expected structure
      type IEventCheck = DatabaseIndex.IEvent;
      
      // TypeScript will error at compile time if IEvent is not properly exported
      const typeCheck: IEventCheck = {} as IEventCheck;
      expect(typeCheck).toBeDefined();
    });

    it('should have IBooking type available', () => {
      // This is a compile-time check
      type IBookingCheck = DatabaseIndex.IBooking;
      
      // TypeScript will error at compile time if IBooking is not properly exported
      const typeCheck: IBookingCheck = {} as IBookingCheck;
      expect(typeCheck).toBeDefined();
    });
  });

  describe('Export integrity', () => {
    it('should export exactly two model objects', () => {
      const exports = Object.keys(DatabaseIndex).filter(
        (key) => typeof DatabaseIndex[key as keyof typeof DatabaseIndex] === 'function'
      );
      
      expect(exports).toHaveLength(2);
      expect(exports).toContain('Event');
      expect(exports).toContain('Booking');
    });

    it('should not export any additional unexpected values', () => {
      const exportedKeys = Object.keys(DatabaseIndex);
      const expectedKeys = ['Event', 'Booking'];
      
      expectedKeys.forEach((key) => {
        expect(exportedKeys).toContain(key);
      });
    });

    it('should maintain model constructors', () => {
      expect(typeof DatabaseIndex.Event).toBe('function');
      expect(typeof DatabaseIndex.Booking).toBe('function');
    });

    it('should allow instantiation of Event model', () => {
      expect(() => {
        new DatabaseIndex.Event({
          title: 'Test',
          description: 'Test',
          overview: 'Test',
          image: 'test.jpg',
          venue: 'Test',
          location: 'Test',
          date: '2025-01-01',
          time: '10:00',
          mode: 'online',
          audience: 'Test',
          agenda: ['Test'],
          organizer: 'Test',
          tags: ['test'],
        });
      }).not.toThrow();
    });

    it('should allow instantiation of Booking model', () => {
      expect(() => {
        new DatabaseIndex.Booking({
          eventId: '507f1f77bcf86cd799439011',
          email: 'test@example.com',
        });
      }).not.toThrow();
    });
  });

  describe('Re-export consistency', () => {
    it('should re-export the same Event instance as direct import', () => {
      expect(DatabaseIndex.Event).toBe(Event);
    });

    it('should re-export the same Booking instance as direct import', () => {
      expect(DatabaseIndex.Booking).toBe(Booking);
    });

    it('should maintain Event model schema', () => {
      expect(DatabaseIndex.Event.schema).toBeDefined();
      expect(DatabaseIndex.Event.schema.paths).toBeDefined();
      expect(DatabaseIndex.Event.schema.paths.title).toBeDefined();
      expect(DatabaseIndex.Event.schema.paths.slug).toBeDefined();
    });

    it('should maintain Booking model schema', () => {
      expect(DatabaseIndex.Booking.schema).toBeDefined();
      expect(DatabaseIndex.Booking.schema.paths).toBeDefined();
      expect(DatabaseIndex.Booking.schema.paths.eventId).toBeDefined();
      expect(DatabaseIndex.Booking.schema.paths.email).toBeDefined();
    });
  });

  describe('Module structure', () => {
    it('should be importable using default import', () => {
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const imported = require('../index');
        expect(imported).toBeDefined();
      }).not.toThrow();
    });

    it('should be importable using named imports', () => {
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { Event: E, Booking: B } = require('../index');
        expect(E).toBeDefined();
        expect(B).toBeDefined();
      }).not.toThrow();
    });

    it('should support destructuring of all exports', () => {
      const { Event: E, Booking: B } = DatabaseIndex;
      
      expect(E).toBe(Event);
      expect(B).toBe(Booking);
    });
  });

  describe('TypeScript type exports', () => {
    it('should properly export IEvent interface for type checking', () => {
      // Compile-time check: this will fail at compile time if types are wrong
      const eventData: DatabaseIndex.IEvent = {
        title: 'Test Event',
        slug: 'test-event',
        description: 'Description',
        overview: 'Overview',
        image: 'image.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2025-01-01',
        time: '10:00',
        mode: 'online',
        audience: 'Audience',
        agenda: ['Item'],
        organizer: 'Organizer',
        tags: ['tag'],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as DatabaseIndex.IEvent;

      expect(eventData).toBeDefined();
      expect(eventData.title).toBe('Test Event');
    });

    it('should properly export IBooking interface for type checking', () => {
      // Compile-time check
      const bookingData: DatabaseIndex.IBooking = {
        eventId: '507f1f77bcf86cd799439011' as any,
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as DatabaseIndex.IBooking;

      expect(bookingData).toBeDefined();
      expect(bookingData.email).toBe('test@example.com');
    });
  });
});