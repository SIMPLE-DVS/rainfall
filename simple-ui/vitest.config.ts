import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { quasar, transformAssetUrls } from '@quasar/vite-plugin';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    environment: 'happy-dom',
    setupFiles: 'test/vitest/setup-file.ts',
    include: [
      // Matches vitest tests in any subfolder of 'test/vitest/__tests__'
      // Matches all files with extension '.test.ts'
      'test/vitest/__tests__/**/*.test.ts',
    ],
    coverage: {
      exclude: [
        'src/i18n/',
        'src/**/*.{cy.ts,d.ts,spec.ts}',
        'test/**/*.{js,ts,vue}',
      ],
      include: ['src/**/*.{js,ts,vue}'],
      reporter: ['lcov', 'text'],
      reportsDirectory: 'coverage/vitest',
      all: true,
    },
  },
  plugins: [
    vue({
      template: { transformAssetUrls },
    }),
    quasar({
      sassVariables: 'src/quasar-variables.scss',
    }),
    tsconfigPaths(),
  ],
});
