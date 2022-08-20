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
import { useRepoStore } from 'src/stores/repoStore';
import { CustomNodeStructure, Repository } from 'src/components/models';
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

  it('returns null and notifies if no repo is selected', async () => {
    expect(NotifyWrapper).toBeTruthy();
    mount(NotifyWrapper, {});
    const spy = vi.spyOn(Notify, 'create');
    expect(spy).not.toHaveBeenCalled();
    expect(getConfig()).toBeNull();
    expect(spy).toHaveBeenCalled();
  });

  it('returns a valid config if a repo is selected', async () => {
    const repoStore = useRepoStore();
    repoStore.repos = new Map<string, Repository>([
      ['abc', { name: 'abc', type: 'local' }],
      ['def', { name: 'def', type: 'local' }],
    ]);
    repoStore.currentRepo = 'abc';
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
