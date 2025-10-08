import mongoose from 'mongoose';
import { environment } from './environment';

mongoose.set('strictQuery', false);

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3_000;

async function connectWithRetry(mongoUri: string, attempt = 1): Promise<void> {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
  } catch (error) {
    if (attempt >= MAX_RETRIES) {
      console.error('Exceeded maximum retries connecting to MongoDB');
      throw error;
    }

    console.warn(`MongoDB connection failed (attempt ${attempt}). Retrying in ${RETRY_DELAY_MS / 1000} seconds...`);
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    await connectWithRetry(mongoUri, attempt + 1);
  }
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  const mongoUri = process.env.MONGODB_URI ?? environment.mongodbUri;

  if (!mongoUri) {
    throw new Error('Environment variable MONGODB_URI is required');
  }

  await connectWithRetry(mongoUri);

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error', err);
  });

  return mongoose;
}

export async function disconnectFromDatabase(): Promise<void> {
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}