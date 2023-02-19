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
import FloatConfigComponent from '../FloatConfigComponent.vue';
import { SimpleNodeParameter } from '../../models';

describe('FloatConfigComponent', () => {
  it('has an initial value', () => {
    cy.mount(FloatConfigComponent, {
      props: {
        modelValue: 123.45,
        param: {} as SimpleNodeParameter,
        nodeName: 'node',
      },
    });
    cy.dataCy('input').then((input) => {
      const v = Cypress.vueWrapper as unknown as VueWrapper<
        InstanceType<typeof FloatConfigComponent>
      >;
      expect(v.vm.value).to.equal('123.45');
      cy.wrap(input)
        .type('67')
        .then(() => {
          expect(v.vm.value).to.equal('123.4567');
          cy.wrap(input)
            .blur()
            .then(() => {
              expect(v.emitted('update:modelValue')[0][0]).to.equal(123.4567);
            });
        });
    });
  });

  it('supports null value', () => {
    cy.mount(FloatConfigComponent, {
      props: {
        modelValue: null,
        param: {} as SimpleNodeParameter,
        nodeName: 'node',
      },
    });

    cy.dataCy('input').then(() => {
      const v = Cypress.vueWrapper as unknown as VueWrapper<
        InstanceType<typeof FloatConfigComponent>
      >;
      expect(v.vm.value).to.equal('');
    });
  });

  it('converts values if needed', () => {
    cy.mount(FloatConfigComponent, {
      props: {
        modelValue: null,
        param: {} as SimpleNodeParameter,
        nodeName: 'node',
      },
    });

    cy.dataCy('input').then((input) => {
      const v = Cypress.vueWrapper as unknown as VueWrapper<
        InstanceType<typeof FloatConfigComponent>
      >;
      cy.wrap(input)
        .type('1.23e2')
        .blur()
        .then(() => {
          expect(v.emitted('update:modelValue')[0][0]).to.equal(123);
        });
    });
  });

  it('requires a value if the parameter is mandatory', () => {
    cy.mount(FloatConfigComponent, {
      props: {
        modelValue: null,
        param: { is_mandatory: true } as SimpleNodeParameter,
        nodeName: 'node',
      },
    });

    cy.dataCy('input')
      .type('{selectAll}{backspace}')
      .blur()
      .then(() => {
        cy.get('div[role=alert]').should('exist');
      });
  });
});
