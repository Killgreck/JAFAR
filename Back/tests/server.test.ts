import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { startServer } from '../src/server';
import * as database from '../src/config/database';

describe('Server', () => {
  let mockServer: any;
  let mockListen: any;
  let mockClose: any;
  let processExitSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockClose = vi.fn((callback: () => void) => {
      if (callback) callback();
    });

    mockServer = {
      close: mockClose,
      listen: vi.fn(),
    };

    mockListen = vi.fn((port: number, callback: () => void) => {
      if (callback) callback();
      return mockServer;
    });

    vi.spyOn(database, 'connectToDatabase').mockResolvedValue({} as any);
    vi.spyOn(database, 'disconnectFromDatabase').mockResolvedValue();
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);

    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('startServer', () => {
    it('should start server on configured port', async () => {
      vi.doMock('../src/app', () => ({
        createApp: () => ({
          listen: mockListen,
        }),
      }));

      const { startServer: start } = await import('../src/server');

      await start();

      expect(database.connectToDatabase).toHaveBeenCalled();
      expect(mockListen).toHaveBeenCalled();
    });

    it('should connect to database before starting', async () => {
      const connectSpy = vi.spyOn(database, 'connectToDatabase');

      vi.doMock('../src/app', () => ({
        createApp: () => ({
          listen: mockListen,
        }),
      }));

      const { startServer: start } = await import('../src/server');
      await start();

      expect(connectSpy).toHaveBeenCalled();
      expect(mockListen).toHaveBeenCalled();
    });

    it('should handle SIGINT signal', async () => {
      const listeners: Record<string, Function> = {};

      vi.spyOn(process, 'on').mockImplementation((event: string, handler: any) => {
        listeners[event] = handler;
        return process;
      });

      vi.doMock('../src/app', () => ({
        createApp: () => ({
          listen: mockListen,
        }),
      }));

      const { startServer: start } = await import('../src/server');
      await start();

      expect(listeners['SIGINT']).toBeDefined();

      await listeners['SIGINT']();

      expect(mockClose).toHaveBeenCalled();
      expect(database.disconnectFromDatabase).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    it('should handle SIGTERM signal', async () => {
      const listeners: Record<string, Function> = {};

      vi.spyOn(process, 'on').mockImplementation((event: string, handler: any) => {
        listeners[event] = handler;
        return process;
      });

      vi.doMock('../src/app', () => ({
        createApp: () => ({
          listen: mockListen,
        }),
      }));

      const { startServer: start } = await import('../src/server');
      await start();

      expect(listeners['SIGTERM']).toBeDefined();

      await listeners['SIGTERM']();

      expect(mockClose).toHaveBeenCalled();
      expect(database.disconnectFromDatabase).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    it('should log server start message', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');

      vi.doMock('../src/app', () => ({
        createApp: () => ({
          listen: mockListen,
        }),
      }));

      const { startServer: start } = await import('../src/server');
      await start();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Server running on port'));
    });

    it('should log shutdown message on SIGINT', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      const listeners: Record<string, Function> = {};

      vi.spyOn(process, 'on').mockImplementation((event: string, handler: any) => {
        listeners[event] = handler;
        return process;
      });

      vi.doMock('../src/app', () => ({
        createApp: () => ({
          listen: mockListen,
        }),
      }));

      const { startServer: start } = await import('../src/server');
      await start();

      await listeners['SIGINT']();

      expect(consoleLogSpy).toHaveBeenCalledWith('Shutting down server...');
      expect(consoleLogSpy).toHaveBeenCalledWith('HTTP server closed.');
    });
  });
});
