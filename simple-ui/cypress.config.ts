import registerCodeCoverageTasks from '@cypress/code-coverage/task';
import { injectQuasarDevServerConfig } from '@quasar/quasar-app-extension-testing-e2e-cypress/cct-dev-server';
import { defineConfig } from 'cypress';

export default defineConfig({
  downloadsFolder: 'test/cypress/downloads',
  fixturesFolder: 'test/cypress/fixtures',
  screenshotsFolder: 'test/cypress/screenshots',
  screenshotOnRunFailure: false,
  videosFolder: 'test/cypress/videos',
  video: false,
  e2e: {
    setupNodeEvents(on, config) {
      registerCodeCoverageTasks(on, config);
      return config;
    },
    baseUrl: 'http://localhost:7000/',
    supportFile: 'test/cypress/support/e2e.ts',
    specPattern: 'test/cypress/e2e/**/*.cy.ts',
  },
  component: {
    setupNodeEvents(on, config) {
      registerCodeCoverageTasks(on, config);
      return config;
    },
    supportFile: 'test/cypress/support/component.ts',
    specPattern: 'src/**/*.cy.ts',
    indexHtmlFile: 'test/cypress/support/component-index.html',
    devServer: injectQuasarDevServerConfig(),
  },
  retries: 5,
});
