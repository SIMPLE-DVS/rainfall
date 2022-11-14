import { installQuasar } from '@quasar/quasar-app-extension-testing-unit-vitest';
import { useRepoStore } from 'src/stores/repoStore';
import { describe, expect, it } from 'vitest';

installQuasar();

describe('repoStore test', () => {
  it('has no element at the beginning', async () => {
    const repoStore = useRepoStore();
    expect(repoStore.repos.size).toBe(0);
    expect(repoStore.archivedRepos.size).toBe(0);
  });
});
