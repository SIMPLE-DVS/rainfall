/*
 Copyright (C) 2023 Università degli Studi di Camerino and Sigma S.p.A.
 Authors: Alessandro Antinori, Rosario Capparuccia, Riccardo Coltrinari, Flavio Corradini, Marco Piangerelli, Barbara Re, Marco Scarpetta

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as
 published by the Free Software Foundation, either version 3 of the
 License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

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
