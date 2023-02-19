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
import { useConfigStore } from 'src/stores/configStore';
import { describe, expect, it } from 'vitest';

installQuasar();

describe('configStore test', () => {
  it('has no element at the beginning', async () => {
    const configStore = useConfigStore();
    expect(configStore.nodeConfigs.size).toBe(0);
    expect(configStore.nodeAnyConfigs.size).toBe(0);
    expect(configStore.nodeStructures.size).toBe(0);
  });

  it('has methods to clear configs and structures', async () => {
    const configStore = useConfigStore();
    configStore.nodeConfigs.set('c1', null);
    configStore.nodeConfigs.set('c2', null);
    expect(configStore.nodeConfigs.size).toBe(2);
    configStore.nodeAnyConfigs.set('a1', null);
    expect(configStore.nodeAnyConfigs.size).toBe(1);
    configStore.nodeStructures.set('s1', null);
    configStore.nodeStructures.set('s2', null);
    configStore.nodeStructures.set('s3', null);
    expect(configStore.nodeStructures.size).toBe(3);
    configStore.clearNodeConfigs();
    expect(configStore.nodeConfigs.size).toBe(0);
    expect(configStore.nodeAnyConfigs.size).toBe(0);
    configStore.clearNodeStructures();
    expect(configStore.nodeStructures.size).toBe(0);
  });
});
