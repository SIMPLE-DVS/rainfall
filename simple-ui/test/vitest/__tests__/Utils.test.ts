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
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Notify } from 'quasar';
import NotifyWrapper from './wrappers/NotifyWrapper.vue';
import { mount } from '@vue/test-utils';
import {
  downloadPythonScript,
  downloadUI,
  getConfig,
} from 'src/components/utils';
import { CustomNodeStructure } from 'src/components/models';
import { useCanvasStore } from 'src/stores/canvasStore';
import { useConfigStore } from 'src/stores/configStore';
import { getUIState } from 'src/components/d3/utils';

installQuasar({ plugins: { Notify } });

describe('utils test', () => {
  beforeEach(() => {
    const configStore = useConfigStore();
    configStore.addNodeStructure({
      package: 'rain.nodes.pandas.model_io.PickleModelLoad',
      clazz: 'PickleModelLoad',
      input: {},
      output: {
        model: 'pickle',
      },
      parameter: [
        {
          name: 'path',
          description: 'The path of the stored object/model.',
          is_mandatory: true,
          type: 'str',
          default_value: null,
        },
      ],
      methods: null,
      tags: {
        library: 'Other',
        type: 'Input',
      },
      description:
        'Node that loads a given object, for instance a trained model, stored in pickle format.',
    });
    configStore.addNodeStructure({
      package: 'rain.nodes.custom.custom.CustomNode1',
      clazz: 'PrintModel',
      input: {
        model: 'custom',
      },
      output: {},
      parameter: [],
      methods: null,
      tags: {
        library: 'Base',
        type: 'Custom',
      },
      description: 'A Custom Node.',
      function_name: 'print_model',
      code: 'def print_model(i, o):\n    print(i["model"])',
    } as CustomNodeStructure);
    configStore.nodeConfigs.set('PickleModelLoad1', {
      path: 'model.pkl',
    });
    configStore.nodeConfigs.set('PrintModel1', {});

    const canvasStore = useCanvasStore();
    canvasStore.canvasNodes.set('PickleModelLoad1', {
      name: 'PickleModelLoad1',
      package: 'rain.nodes.pandas.model_io.PickleModelLoad',
      x: 669,
      y: 433,
      selected: false,
    });
    canvasStore.canvasNodes.set('PrintModel1', {
      name: 'PrintModel1',
      package: 'rain.nodes.custom.custom.CustomNode1',
      x: 988,
      y: 457,
      selected: true,
    });
    canvasStore.canvasEdges.set(
      'PickleModelLoad1-{out}-model|PrintModel1-{in}-model',
      {
        fromNode: 'PickleModelLoad1',
        fromPort: 'model',
        toNode: 'PrintModel1',
        toPort: 'model',
      }
    );
  });

  it('returns a valid config', async () => {
    expect(getConfig()).not.toBeNull();
  });

  it('successfully downloads the UI state', async () => {
    mount(NotifyWrapper, {});
    const notifySpy = vi.spyOn(Notify, 'create');
    const uiState = getUIState();
    expect(notifySpy).not.toHaveBeenCalled();
    downloadUI(uiState);
    expect(notifySpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'positive' })
    );
  });

  it('successfully downloads the Python script', async () => {
    mount(NotifyWrapper, {});
    const notifySpy = vi.spyOn(Notify, 'create');
    expect(notifySpy).not.toHaveBeenCalled();
    downloadPythonScript('script');
    expect(notifySpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'positive' })
    );
  });
});
