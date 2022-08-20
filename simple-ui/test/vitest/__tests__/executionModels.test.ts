import { installQuasar } from '@quasar/quasar-app-extension-testing-unit-vitest';
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import ExecutionCanvas from 'src/components/execution/ExecutionCanvas.vue';

installQuasar();

describe('executionModels test', () => {
  it('has no nodes and edges at the beginning', async () => {
    const comp = mount(ExecutionCanvas);
    const d3g = comp.vm.d3g;
    expect(d3g.selectAll('.node').nodes()).toHaveLength(0);
    expect(d3g.selectAll('.edge').nodes()).toHaveLength(0);
  });
});
