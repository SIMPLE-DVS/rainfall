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
