// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

// DO NOT REMOVE
// Imports Quasar Cypress AE predefined commands
import { registerCommands } from '@quasar/quasar-app-extension-testing-e2e-cypress';
registerCommands();

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to drop a node in the canvas
       * @param library the library of the node
       * @param name the name of the node
       * @param x the x position on the canvas
       * @param y the y position on the canvas
       * @example cy.dropNode('Base', 'CustomNode', 100, 100)
       */
      dropNode(
        library: string,
        name: string,
        x?: number,
        y?: number,
        options?: Partial<TypeOptions>
      ): Chainable<unknown>;

      /**
       * Create or edit a custom node in the editor
       * @param code the code of the custom node
       * @param name the name of the custom node
       * @param edit whether the custom node has already been created
       * @example cy.createOrEditCustomNode('def custom_function(i, o, p):\no["o1"] = i["i1"] + i["i2"]', 'CustomNodeName', false);
       */
      createOrEditCustomNode(
        code: string,
        name: string,
        edit?: boolean,
        options?: Partial<TypeOptions>
      ): Chainable<unknown>;
    }
  }
}
