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

describe('D3 Page tests', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/v1/nodes', []);
    cy.intercept('GET', '**/api/v1/repositories', []);
    cy.intercept('GET', '**/api/v1/repositories/archived', []);
    cy.visit('/');
  });

  it('includes "RAINFALL" in the title', () => {
    cy.title().should('include', 'RAINFALL');
  });

  it('has tabs for different pages', () => {
    const homeTab = cy.get('.q-tab').first();
    homeTab.should('have.attr', 'href', '#/canvas');
    const editorTab = homeTab.next();
    editorTab.should('have.attr', 'href', '#/editor');
    const executionTab = editorTab.next();
    executionTab.should('have.attr', 'href', '#/execution');
    const importExportTab = executionTab.next();
    importExportTab.should('have.attr', 'href', '#/import_export');
  });

  it('goes to the custom node editor page', () => {
    const editorTab = cy.get('.q-tab[href="#/editor"]');
    editorTab.click().then(() => {
      cy.testRoute('editor');
    });
  });

  it('goes to the execution page', () => {
    const executionTab = cy.get('.q-tab[href="#/execution"]');
    executionTab.click().then(() => {
      cy.testRoute('execution');
    });
  });

  it('goes to the import/export page', () => {
    const importExportTab = cy.get('.q-tab[href="#/import_export"]');
    importExportTab.click().then(() => {
      cy.testRoute('import_export');
    });
  });
});

export {};
