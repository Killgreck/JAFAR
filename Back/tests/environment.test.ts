import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parsePort, parseAppEnv, parseMongoUri } from '../src/config/environment';

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('parsePort', () => {
    it('should parse valid port number', () => {
      const port = parsePort('3000');
      expect(port).toBe(3000);
    });

    it('should use default port 3000 when undefined', () => {
      const port = parsePort(undefined);
      expect(port).toBe(3000);
    });

    it('should throw error for invalid port (NaN)', () => {
      expect(() => parsePort('invalid')).toThrow('Environment variable PORT must be a number between 0 and 65535');
    });

    it('should throw error for negative port', () => {
      expect(() => parsePort('-1')).toThrow('Environment variable PORT must be a number between 0 and 65535');
    });

    it('should throw error for port > 65535', () => {
      expect(() => parsePort('70000')).toThrow('Environment variable PORT must be a number between 0 and 65535');
    });

    it('should accept port 0', () => {
      const port = parsePort('0');
      expect(port).toBe(0);
    });

    it('should accept port 65535', () => {
      const port = parsePort('65535');
      expect(port).toBe(65535);
    });
  });

  describe('parseAppEnv', () => {
    it('should parse development environment', () => {
      const env = parseAppEnv('development');
      expect(env).toBe('development');
    });

    it('should parse production environment', () => {
      const env = parseAppEnv('production');
      expect(env).toBe('production');
    });

    it('should parse test environment', () => {
      const env = parseAppEnv('test');
      expect(env).toBe('test');
    });

    it('should default to development when undefined', () => {
      const env = parseAppEnv(undefined);
      expect(env).toBe('development');
    });

    it('should handle uppercase environment values', () => {
      const env = parseAppEnv('PRODUCTION');
      expect(env).toBe('production');
    });

    it('should throw error for invalid environment', () => {
      expect(() => parseAppEnv('invalid')).toThrow('Environment variable APP_ENV must be development, production, or test');
    });

    it('should throw error for staging environment', () => {
      expect(() => parseAppEnv('staging')).toThrow('Environment variable APP_ENV must be development, production, or test');
    });
  });

  describe('parseMongoUri', () => {
    it('should return provided URI when valid', () => {
      const uri = parseMongoUri('mongodb://localhost:27017/custom', 'development');
      expect(uri).toBe('mongodb://localhost:27017/custom');
    });

    it('should return default URI for development when not provided', () => {
      const uri = parseMongoUri(undefined, 'development');
      expect(uri).toBe('mongodb://127.0.0.1:27017/jafar');
    });

    it('should return default URI for test when not provided', () => {
      const uri = parseMongoUri(undefined, 'test');
      expect(uri).toBe('mongodb://127.0.0.1:27017/jafar-test');
    });

    it('should throw error for production without URI', () => {
      expect(() => parseMongoUri(undefined, 'production')).toThrow('Environment variable MONGODB_URI is required');
    });

    it('should throw error for empty string in production', () => {
      expect(() => parseMongoUri('   ', 'production')).toThrow('Environment variable MONGODB_URI is required');
    });

    it('should accept whitespace-only URI in development', () => {
      const uri = parseMongoUri('   ', 'development');
      expect(uri).toBe('mongodb://127.0.0.1:27017/jafar');
    });

    it('should trim and accept valid URI', () => {
      const uri = parseMongoUri('  mongodb://localhost:27017/db  ', 'production');
      expect(uri).toBe('  mongodb://localhost:27017/db  ');
    });
  });

  describe('defaultMongoUri', () => {
    it('should return test suffix for test environment', () => {
      const uri = parseMongoUri(undefined, 'test');
      expect(uri).toContain('-test');
    });

    it('should not have suffix for development', () => {
      const uri = parseMongoUri(undefined, 'development');
      expect(uri).not.toContain('-test');
    });
  });
});
