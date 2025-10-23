import { describe, it, expect, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { connectToDatabase, disconnectFromDatabase } from '../src/config/database';

describe('Database connection', () => {
  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await disconnectFromDatabase();
    }
  });

  it('connects and disconnects successfully', async () => {
    const connection = await connectToDatabase();
    expect(connection).toBeDefined();
    expect(mongoose.connection.readyState).toBe(1);

    await disconnectFromDatabase();
    expect(mongoose.connection.readyState).toBe(0);
  });
});
