import { installQuasar } from '@quasar/quasar-app-extension-testing-unit-vitest';
import { useCanvasStore } from 'src/stores/canvasStore';
import { describe, expect, it } from 'vitest';

installQuasar();

describe('canvasStore test', () => {
  it('has no element at the beginning', async () => {
    const canvasStore = useCanvasStore();
    expect(canvasStore.canvasNodes.size).toBe(0);
    expect(canvasStore.canvasEdges.size).toBe(0);
  });

  it('has methods to clear nodes and edges', async () => {
    const canvasStore = useCanvasStore();
    canvasStore.canvasNodes.set('n1', null);
    canvasStore.canvasNodes.set('n2', null);
    expect(canvasStore.canvasNodes.size).toBe(2);
    canvasStore.canvasEdges.set('e1', null);
    expect(canvasStore.canvasEdges.size).toBe(1);
    canvasStore.clearCanvasNodes();
    expect(canvasStore.canvasNodes.size).toBe(0);
    canvasStore.clearCanvasEdges();
    expect(canvasStore.canvasEdges.size).toBe(0);
  });
});
