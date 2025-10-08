import { describe, expect, it } from 'vitest';
import request from 'supertest';

import { createApp } from '../src/app';

const app = createApp();

describe('GET /api/health', () => {
  it('should respond with status ok', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
