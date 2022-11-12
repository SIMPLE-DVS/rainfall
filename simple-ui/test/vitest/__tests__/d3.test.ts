import { installQuasar } from '@quasar/quasar-app-extension-testing-unit-vitest';
import { readFileSync } from 'fs';
import { loadUIFromFile, loadUIFromScript } from 'src/components/d3/utils';
import { expect, describe, it } from 'vitest';
import { api } from 'src/boot/axios';
import MockAdapter from 'axios-mock-adapter';

installQuasar();

describe('d3 test', () => {
  it('successfully loads the UI state from JSON file', async () => {
    const ui = require('../fixtures/ui.json');
    const file = new File([JSON.stringify(ui)], 'ui.json', {
      type: 'text/plain',
    });
    const res = await loadUIFromFile(file);
    expect(res).toBe(true);
  });

  it('successfully loads the UI state from Python script', async () => {
    const reversed = require('../fixtures/reversed.json');
    const mock = new MockAdapter(api);
    void mock.onPost('/script').reply(200, reversed);
    const script = readFileSync('test/vitest/fixtures/script.py');
    const file = new File([script], 'script.py', {
      type: 'text/plain',
    });
    const res = await loadUIFromScript(file);
    expect(res).toBe(true);
  });
});
