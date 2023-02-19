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
import TupleConfigComponent from '../TupleConfigComponent.vue';
import { SimpleNodeParameter } from '../../models';
import IntConfigComponent from '../IntConfigComponent.vue';

describe('TupleConfigComponent', () => {
  it('has an initial value and options', () => {
    cy.mount(TupleConfigComponent, {
      props: {
        modelValue: [123, '45'],
        param: {
          name: 'param',
          is_mandatory: false,
          type: 'tuple[int,str]',
        } as SimpleNodeParameter,
        nodeName: 'node',
      },
    });
    cy.dataCy('tuple').then(() => {
      const v = Cypress.vueWrapper as unknown as VueWrapper<
        InstanceType<typeof TupleConfigComponent>
      >;
      expect(v.vm.types).to.have.length(2);
      expect(v.vm.types).to.deep.equal(['int', 'str']);
    });
  });

  it('supports null values', () => {
    cy.mount(TupleConfigComponent, {
      props: {
        modelValue: null,
        param: {
          name: 'param',
          is_mandatory: false,
          type: 'tuple[int,str]',
        } as SimpleNodeParameter,
        nodeName: 'node',
      },
    });
    cy.dataCy('tuple').then(() => {
      const v = Cypress.vueWrapper as unknown as VueWrapper<
        InstanceType<typeof TupleConfigComponent>
      >;
      expect(v.vm.types).to.have.length(2);
      expect(v.vm.value).to.deep.equal([null, null]);
    });
  });

  it('changes values', () => {
    cy.mount(TupleConfigComponent, {
      props: {
        modelValue: [1, null],
        param: {
          name: 'param',
          is_mandatory: false,
          type: 'tuple[int,int]',
        } as SimpleNodeParameter,
        nodeName: 'node',
      },
    });
    cy.dataCy('tuple').then(() => {
      const v = Cypress.vueWrapper as unknown as VueWrapper<
        InstanceType<typeof TupleConfigComponent>
      >;
      expect(v.vm.types).to.have.length(2);
      cy.dataCy('input')
        .first()
        .then((input) => {
          const i = Cypress.vueWrapper as unknown as VueWrapper<
            InstanceType<typeof IntConfigComponent>
          >;
          cy.wrap(input)
            .type('23')
            .blur()
            .then(() => {
              expect(i.emitted('update:modelValue')[0][0]).to.deep.equal([
                123,
                null,
              ]);
              expect(v.vm.value).to.deep.equal([123, null]);
            });
        });
    });
  });
});
