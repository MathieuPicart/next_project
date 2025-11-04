import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('MongoDB Connection Module', () => {
  let mongoServer: MongoMemoryServer;
  let originalEnv: string | undefined;
  let connectDB: () => Promise<typeof mongoose>;

  beforeAll(() => {
    originalEnv = process.env.MONGODB_URI;
  });

  afterAll(() => {
    if (originalEnv) {
      process.env.MONGODB_URI = originalEnv;
    } else {
      delete process.env.MONGODB_URI;
    }
  });

  beforeEach(async () => {
    // Create a new in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    process.env.MONGODB_URI = mongoUri;

    // Clear the module cache to get a fresh import
    jest.resetModules();
    
    // Clear global mongoose cache
    if (global.mongoose) {
      global.mongoose = { conn: null, promise: null };
    }

    // Disconnect any existing connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Import the module fresh
    const module = await import('../../lib/mongodb');
    connectDB = module.default;
  });

  afterEach(async () => {
    // Clean up connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    // Stop the MongoDB server
    await mongoServer.stop();

    // Clear global cache
    if (global.mongoose) {
      global.mongoose = { conn: null, promise: null };
    }
  });

  describe('Environment variable validation', () => {
    it('should throw error if MONGODB_URI is not defined', async () => {
      delete process.env.MONGODB_URI;
      jest.resetModules();

      await expect(async () => {
        await import('../../lib/mongodb');
      }).rejects.toThrow(/MONGODB_URI.*environment variable/i);
    });

    it('should not throw error if MONGODB_URI is defined', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      jest.resetModules();

      await expect(async () => {
        await import('../../lib/mongodb');
      }).resolves.not.toThrow();
    });
  });

  describe('Connection establishment', () => {
    it('should successfully connect to MongoDB', async () => {
      const connection = await connectDB();

      expect(connection).toBeDefined();
      expect(mongoose.connection.readyState).toBe(1); // 1 = connected
    });

    it('should return mongoose instance on successful connection', async () => {
      const connection = await connectDB();

      expect(connection).toBe(mongoose);
      expect(connection.connection).toBeDefined();
    });

    it('should set bufferCommands to false', async () => {
      await connectDB();

      expect(mongoose.connection.options.bufferCommands).toBe(false);
    });

    it('should handle connection to valid URI', async () => {
      const connection = await connectDB();

      expect(connection.connection.host).toBeTruthy();
      expect(connection.connection.name).toBeTruthy();
    });
  });

  describe('Connection caching', () => {
    it('should cache the connection on first call', async () => {
      const connection1 = await connectDB();
      const connection2 = await connectDB();

      expect(connection1).toBe(connection2);
      expect(connection1).toBe(mongoose);
    });

    it('should reuse cached connection on subsequent calls', async () => {
      await connectDB();
      
      // Get the cached connection
      const cachedConn = global.mongoose?.conn;
      expect(cachedConn).toBeDefined();

      // Call again
      await connectDB();
      
      // Should still be the same connection
      expect(global.mongoose?.conn).toBe(cachedConn);
    });

    it('should return existing connection immediately if cached', async () => {
      const startTime = Date.now();
      await connectDB();
      const firstCallTime = Date.now() - startTime;

      const cachedStartTime = Date.now();
      await connectDB();
      const cachedCallTime = Date.now() - cachedStartTime;

      // Cached call should be significantly faster
      expect(cachedCallTime).toBeLessThan(firstCallTime);
    });

    it('should initialize global mongoose cache if not present', async () => {
      expect(global.mongoose).toBeDefined();
      
      await connectDB();
      
      expect(global.mongoose?.conn).toBeDefined();
      expect(global.mongoose?.promise).toBeDefined();
    });

    it('should use existing global cache if present', async () => {
      // Set up a global cache
      const mockCache = { conn: null, promise: null };
      global.mongoose = mockCache;

      await connectDB();

      // Should have populated the same cache object
      expect(global.mongoose).toBe(mockCache);
      expect(global.mongoose.conn).toBeDefined();
    });
  });

  describe('Connection promise handling', () => {
    it('should create connection promise on first call', async () => {
      expect(global.mongoose?.promise).toBeNull();

      const connectionPromise = connectDB();
      
      expect(global.mongoose?.promise).toBeDefined();
      expect(global.mongoose?.promise).toBeInstanceOf(Promise);

      await connectionPromise;
    });

    it('should reuse existing promise if connection in progress', async () => {
      const promise1 = connectDB();
      const promise2 = connectDB();

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1).toBe(result2);
      expect(result1).toBe(mongoose);
    });

    it('should wait for pending connection promise', async () => {
      const connections = await Promise.all([
        connectDB(),
        connectDB(),
        connectDB(),
      ]);

      expect(connections[0]).toBe(connections[1]);
      expect(connections[1]).toBe(connections[2]);
    });
  });

  describe('Error handling', () => {
    it('should reset promise cache on connection error', async () => {
      // Set invalid URI to force error
      process.env.MONGODB_URI = 'mongodb://invalid:27017/test';
      jest.resetModules();
      
      // Clear cache
      if (global.mongoose) {
        global.mongoose = { conn: null, promise: null };
      }

      const module = await import('../../lib/mongodb');
      const connectDBWithError = module.default;

      await expect(connectDBWithError()).rejects.toThrow();

      // Promise should be reset to null after error
      expect(global.mongoose?.promise).toBeNull();
    });

    it('should allow retry after failed connection', async () => {
      // First attempt with invalid URI
      process.env.MONGODB_URI = 'mongodb://invalid:27017/test';
      jest.resetModules();
      
      if (global.mongoose) {
        global.mongoose = { conn: null, promise: null };
      }

      let module = await import('../../lib/mongodb');
      let connectDBWithError = module.default;

      await expect(connectDBWithError()).rejects.toThrow();

      // Reset with valid URI
      const validUri = mongoServer.getUri();
      process.env.MONGODB_URI = validUri;
      jest.resetModules();
      
      if (global.mongoose) {
        global.mongoose = { conn: null, promise: null };
      }

      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }

      module = await import('../../lib/mongodb');
      const connectDBValid = module.default;

      // Should succeed on retry
      await expect(connectDBValid()).resolves.toBeDefined();
    });

    it('should throw error for malformed connection string', async () => {
      process.env.MONGODB_URI = 'not-a-valid-uri';
      jest.resetModules();
      
      if (global.mongoose) {
        global.mongoose = { conn: null, promise: null };
      }

      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }

      const module = await import('../../lib/mongodb');
      const connectDBInvalid = module.default;

      await expect(connectDBInvalid()).rejects.toThrow();
    });

    it('should handle connection timeout gracefully', async () => {
      // Use a non-routable IP to simulate timeout
      process.env.MONGODB_URI = 'mongodb://192.0.2.1:27017/test';
      jest.resetModules();
      
      if (global.mongoose) {
        global.mongoose = { conn: null, promise: null };
      }

      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }

      const module = await import('../../lib/mongodb');
      const connectDBTimeout = module.default;

      await expect(connectDBTimeout()).rejects.toThrow();
      expect(global.mongoose?.promise).toBeNull();
    }, 15000);
  });

  describe('Multiple connection scenarios', () => {
    it('should handle rapid successive connection attempts', async () => {
      const attempts = Array(10).fill(null).map(() => connectDB());
      const results = await Promise.all(attempts);

      // All should return the same connection
      const firstConnection = results[0];
      results.forEach((result) => {
        expect(result).toBe(firstConnection);
      });
    });

    it('should maintain single connection across multiple calls', async () => {
      await connectDB();
      const firstConnection = mongoose.connection;

      await connectDB();
      await connectDB();

      expect(mongoose.connection).toBe(firstConnection);
      expect(mongoose.connection.readyState).toBe(1);
    });
  });

  describe('Connection state management', () => {
    it('should have readyState 1 (connected) after successful connection', async () => {
      await connectDB();

      expect(mongoose.connection.readyState).toBe(1);
    });

    it('should store connection in global cache', async () => {
      await connectDB();

      expect(global.mongoose?.conn).toBeDefined();
      expect(global.mongoose?.conn).toBe(mongoose);
    });

    it('should store promise in global cache during connection', async () => {
      const connectionPromise = connectDB();

      expect(global.mongoose?.promise).toBeDefined();
      expect(global.mongoose?.promise).toBeInstanceOf(Promise);

      await connectionPromise;
    });
  });

  describe('Integration scenarios', () => {
    it('should work with mongoose models after connection', async () => {
      await connectDB();

      const TestSchema = new mongoose.Schema({
        name: String,
      });

      const TestModel = mongoose.model('Test', TestSchema);

      const doc = await TestModel.create({ name: 'test' });
      expect(doc.name).toBe('test');

      const found = await TestModel.findById(doc._id);
      expect(found?.name).toBe('test');
    });

    it('should maintain connection for multiple operations', async () => {
      await connectDB();

      const TestSchema = new mongoose.Schema({
        value: Number,
      });

      const TestModel = mongoose.model('TestMulti', TestSchema);

      // Multiple operations
      await TestModel.create({ value: 1 });
      await TestModel.create({ value: 2 });
      await TestModel.create({ value: 3 });

      const count = await TestModel.countDocuments();
      expect(count).toBe(3);

      // Connection should still be active
      expect(mongoose.connection.readyState).toBe(1);
    });
  });
});