import { beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import path from 'path';
import { randomBytes } from 'crypto';
import { mkdirSync } from 'fs';

let mongoServer: MongoMemoryReplSet | null = null;

const uniqueId = randomBytes(8).toString('hex');
const customTmpDir = path.join('/tmp/tmp-test', uniqueId);

beforeAll(
  async () => {
    console.log('Starting MongoDB Memory Server...');

    mkdirSync(customTmpDir, { recursive: true });

    mongoServer = await MongoMemoryReplSet.create({
      binary: {
        version: '6.0.4',
        downloadDir: path.join('/tmp/tmp-test', 'mongodb-binaries'),
      },
      replSet: {
        name: 'testReplSet',
        count: 1,
        dbName: 'test',
        storageEngine: 'ephemeralForTest',
      },
    });

    const uri = mongoServer.getUri();
    console.log('MongoDB Memory Server started at:', uri);

    process.env.MONGODB_URI = uri;
    process.env.APP_ENV = 'test';
    process.env.PORT = '0';

    await mongoose.connect(uri);
    console.log('Test MongoDB connected successfully');
  },
  5 * 60 * 1000
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

afterAll(
  async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }

    if (mongoServer) {
      await mongoServer.stop();
      mongoServer = null;
    }
  },
  30 * 60 * 1000
);
