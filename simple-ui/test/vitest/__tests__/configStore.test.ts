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
