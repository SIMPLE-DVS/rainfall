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

describe('ErrorNotFound Page tests', () => {
  beforeEach(() => {
    cy.visit('#/non-existing');
  });

  it('remains in the non-existing page but returns a 404 page', () => {
    cy.testRoute('non-existing');
    cy.get('div').should('contain.text', '404');
  });

  it('navigates to canvas when clicking on the button', () => {
    cy.get('.q-btn').click();
    cy.testRoute('canvas');
  });
});

export {};
