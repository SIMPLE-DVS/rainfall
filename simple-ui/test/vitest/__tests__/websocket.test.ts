import { installQuasar } from '@quasar/quasar-app-extension-testing-unit-vitest';
import { getWebSocketURL } from 'src/components/utils';
import { describe, expect, it } from 'vitest';
import { WebSocket } from 'ws';

installQuasar();

describe('WebSocket test', () => {
  it('creates a websocket', async () => {
    process.env.BACKEND_URL = 'http://backend';
    const wsURL = getWebSocketURL();
    expect(wsURL).not.toBeNull();
    const ws = new WebSocket(wsURL);
    expect(ws).not.toBeNull();
    expect(ws.readyState).toBe(WebSocket.CONNECTING);
  });
});
