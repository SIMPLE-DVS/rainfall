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

import { VueWrapper } from '@vue/test-utils';
import SelectConfigComponent from '../SelectConfigComponent.vue';
import { SimpleNodeParameter } from '../../models';

describe('SelectConfigComponent', () => {
  it('has an initial value and options', () => {
    cy.mount(SelectConfigComponent, {
      props: {
        modelValue: 'a',
        param: { type: '{a,b,c}' } as SimpleNodeParameter,
        nodeName: 'node',
      },
    });
    cy.dataCy('select').then(() => {
      const v = Cypress.vueWrapper as unknown as VueWrapper<
        InstanceType<typeof SelectConfigComponent>
      >;
      expect(v.vm.value).to.equal('a');
      expect(v.vm.options).to.deep.equal(['a', 'b', 'c']);
    });
  });

  it('supports null value', () => {
    cy.mount(SelectConfigComponent, {
      props: {
        modelValue: null,
        param: { type: '{a,b,c}' } as SimpleNodeParameter,
        nodeName: 'node',
      },
    });

    cy.dataCy('select').then(() => {
      const v = Cypress.vueWrapper as unknown as VueWrapper<
        InstanceType<typeof SelectConfigComponent>
      >;
      expect(v.vm.value).to.equal(null);
    });
  });

  it('selects different values', () => {
    cy.mount(SelectConfigComponent, {
      props: {
        modelValue: null,
        param: { type: '{a,b,c}' } as SimpleNodeParameter,
        nodeName: 'node',
      },
    });

    cy.dataCy('select').should('have.text', '');
    cy.dataCy('select')
      .select('a')
      .then(() => {
        const v = Cypress.vueWrapper as unknown as VueWrapper<
          InstanceType<typeof SelectConfigComponent>
        >;
        expect(v.vm.value).to.equal('a');
        cy.dataCy('select')
          .select('b')
          .then(() => {
            expect(v.vm.value).to.equal('b');
          });
      });
  });

  it('requires a value if the parameter is mandatory', () => {
    cy.mount(SelectConfigComponent, {
      props: {
        modelValue: null,
        param: { type: '{a,b,c}', is_mandatory: true } as SimpleNodeParameter,
        nodeName: 'node',
      },
    });

    cy.dataCy('select')
      .click()
      .then(() => {
        cy.get('body')
          .click(1000, 1000, { force: true })
          .then(() => {
            cy.get('div[role=alert]').should('exist');
          });
      });
  });
});
