import path from 'path';
import { beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer | null = null;

beforeAll(
  async () => {
    mongoServer = await MongoMemoryServer.create({
      binary: {
        downloadDir: path.resolve(__dirname, '../../.cache/mongodb-binaries'),
        version: '7.0.5',
      },
    });

    const uri = mongoServer.getUri();

    process.env.MONGODB_URI = uri;
    process.env.APP_ENV = 'test';
    process.env.PORT = '0';

    await mongoose.connect(uri);
    console.log('Test MongoDB connected');
  },
  30 * 60 * 1000
);

beforeEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const db = mongoose.connection.db;
    if (!db) {
      return;
    }

    const collections = await db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }

  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
});