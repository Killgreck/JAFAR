import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { environment } from './environment';

mongoose.set('strictQuery', false);

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3_000;

let mongoServer: MongoMemoryServer | null = null;

/**
 * Connects to MongoDB with a retry mechanism.
 * @param mongoUri The MongoDB connection string.
 * @param attempt The current connection attempt number.
 */
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

/**
 * Connects to the MongoDB database.
 * @returns A promise that resolves to the Mongoose instance.
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  let mongoUri = process.env.MONGODB_URI ?? environment.mongodbUri;

  // Use MongoMemoryServer in development if local MongoDB is not available
  if (environment.appEnv === 'development' && mongoUri.includes('127.0.0.1')) {
    try {
      // Try to connect to local MongoDB first
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
      console.log('Connected to local MongoDB');
      return mongoose;
    } catch (error) {
      console.log('Local MongoDB not available, starting MongoDB Memory Server...');
      mongoServer = await MongoMemoryServer.create();
      mongoUri = mongoServer.getUri();
      console.log(`MongoDB Memory Server started at ${mongoUri}`);
    }
  }

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

/**
 * Disconnects from the MongoDB database.
 */
export async function disconnectFromDatabase(): Promise<void> {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
    console.log('MongoDB Memory Server stopped');
  }
  console.log('Disconnected from MongoDB');
}