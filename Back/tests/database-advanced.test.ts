import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { connectToDatabase, disconnectFromDatabase } from '../src/config/database';

describe('Database Connection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  describe('connectToDatabase', () => {
    it('should connect successfully with valid URI', async () => {
      const result = await connectToDatabase();
      expect(result).toBe(mongoose);
      expect(mongoose.connection.readyState).toBe(1);
    });

    it('should throw error when MONGODB_URI is not set', async () => {
      const originalUri = process.env.MONGODB_URI;
      delete process.env.MONGODB_URI;
      
      vi.doMock('../src/config/environment', () => ({
        environment: {
          mongodbUri: '',
          port: 3000,
          appEnv: 'test'
        }
      }));

      process.env.MONGODB_URI = '';
      
      await expect(connectToDatabase()).rejects.toThrow('Environment variable MONGODB_URI is required');
      
      process.env.MONGODB_URI = originalUri;
    });

    it('should handle connection with retry on failure', async () => {
      await mongoose.disconnect();
      
      const connectSpy = vi.spyOn(mongoose, 'connect');
      connectSpy.mockRejectedValueOnce(new Error('Connection failed'))
                .mockResolvedValueOnce(mongoose as any);

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      await connectToDatabase();
      
      expect(connectSpy).toHaveBeenCalledTimes(2);
      expect(consoleWarnSpy).toHaveBeenCalled();
      
      consoleWarnSpy.mockRestore();
    });

    it('should throw error after max retries', async () => {
      await mongoose.disconnect();
      
      const connectSpy = vi.spyOn(mongoose, 'connect');
      connectSpy.mockRejectedValue(new Error('Connection failed'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      await expect(connectToDatabase()).rejects.toThrow('Connection failed');
      
      expect(connectSpy).toHaveBeenCalledTimes(5);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Exceeded maximum retries connecting to MongoDB');
      
      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
      connectSpy.mockRestore();
    });

    it('should setup disconnected event listener', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      await connectToDatabase();
      
      mongoose.connection.emit('disconnected');
      
      expect(consoleWarnSpy).toHaveBeenCalledWith('MongoDB disconnected');
      
      consoleWarnSpy.mockRestore();
    });

    it('should setup error event listener', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      await connectToDatabase();
      
      const testError = new Error('Test error');
      mongoose.connection.emit('error', testError);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('MongoDB connection error', testError);
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('disconnectFromDatabase', () => {
    it('should disconnect successfully', async () => {
      await connectToDatabase();
      
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await disconnectFromDatabase();
      
      expect(mongoose.connection.readyState).toBe(0);
      expect(consoleLogSpy).toHaveBeenCalledWith('Disconnected from MongoDB');
      
      consoleLogSpy.mockRestore();
    });

    it('should handle disconnect when already disconnected', async () => {
      await mongoose.disconnect();
      
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await disconnectFromDatabase();
      
      expect(mongoose.connection.readyState).toBe(0);
      
      consoleLogSpy.mockRestore();
    });
  });
});
