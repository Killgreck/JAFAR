import { describe, expect, it } from 'vitest';
import mongoose from 'mongoose';

import { connectToDatabase, disconnectFromDatabase } from '../src/config/database';

describe('Database connection', () => {
  it('connects and disconnects successfully', async () => {
    await connectToDatabase();

    expect(mongoose.connection.readyState).toBe(1);

    await disconnectFromDatabase();

    expect(mongoose.connection.readyState).toBe(0);
  });
});
