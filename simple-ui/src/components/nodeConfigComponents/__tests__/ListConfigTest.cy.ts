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
import ListConfigComponent from '../ListConfigComponent.vue';
import { SimpleNodeParameter } from '../../models';

describe('ListConfigComponent', () => {
  it('has an initial value and works with integers', () => {
    cy.mount(ListConfigComponent, {
      props: {
        modelValue: [1, 2, 3],
        param: { type: 'list[int]' } as SimpleNodeParameter,
        nodeName: 'node',
      },
    });
    cy.dataCy('list').then(() => {
      const v = Cypress.vueWrapper as unknown as VueWrapper<
        InstanceType<typeof ListConfigComponent>
      >;
      expect(v.vm.modelValue).to.deep.equal([1, 2, 3]);
      expect(v.vm.value.split('\n')).to.deep.equal(['1', '2', '3']);
      cy.dataCy('list')
        .type('\n04')
        .blur()
        .then(() => {
          expect(v.vm.value.split('\n')).to.deep.equal(['1', '2', '3', '4']);
          expect(v.emitted('update:modelValue')[0][0]).to.deep.equal([
            1, 2, 3, 4,
          ]);
        });
    });
  });

  it('supports null values', () => {
    cy.mount(ListConfigComponent, {
      props: {
        modelValue: null,
        param: { type: 'list[int]' } as SimpleNodeParameter,
        nodeName: 'node',
      },
    });
    cy.dataCy('list').then(() => {
      const v = Cypress.vueWrapper as unknown as VueWrapper<
        InstanceType<typeof ListConfigComponent>
      >;
      expect(v.vm.modelValue).to.equal(null);
      expect(v.vm.value).to.deep.equal('');
    });
  });

  it('works with floats', () => {
    cy.mount(ListConfigComponent, {
      props: {
        modelValue: [1.2, 2.3, 3.4],
        param: { type: 'list[float]' } as SimpleNodeParameter,
        nodeName: 'node',
      },
    });
    cy.dataCy('list').then(() => {
      const v = Cypress.vueWrapper as unknown as VueWrapper<
        InstanceType<typeof ListConfigComponent>
      >;
      cy.dataCy('list')
        .type('\n04.5e0')
        .blur()
        .then(() => {
          expect(v.vm.value.split('\n')).to.deep.equal([
            '1.2',
            '2.3',
            '3.4',
            '4.5',
          ]);
          expect(v.emitted('update:modelValue')[0][0]).to.deep.equal([
            1.2, 2.3, 3.4, 4.5,
          ]);
        });
    });
  });

  it('works with booleans', () => {
    cy.mount(ListConfigComponent, {
      props: {
        modelValue: [true, false],
        param: { type: 'list[bool]' } as SimpleNodeParameter,
        nodeName: 'node',
      },
    });
    cy.dataCy('list').then(() => {
      const v = Cypress.vueWrapper as unknown as VueWrapper<
        InstanceType<typeof ListConfigComponent>
      >;
      expect(v.vm.modelValue).to.deep.equal([true, false]);
      expect(v.vm.value.split('\n')).to.deep.equal(['true', 'false']);
      cy.dataCy('list')
        .type('\nTrUe\nFALSe')
        .blur()
        .then(() => {
          expect(v.vm.value.split('\n')).to.deep.equal([
            'true',
            'false',
            'true',
            'false',
          ]);
          expect(v.emitted('update:modelValue')[0][0]).to.deep.equal([
            true,
            false,
            true,
            false,
          ]);
        });
    });
  });

  it('works with strings', () => {
    cy.mount(ListConfigComponent, {
      props: {
        modelValue: ['a', 'b', 'c'],
        param: { type: 'list[str]' } as SimpleNodeParameter,
        nodeName: 'node',
      },
    });
    cy.dataCy('list').then(() => {
      const v = Cypress.vueWrapper as unknown as VueWrapper<
        InstanceType<typeof ListConfigComponent>
      >;
      expect(v.vm.modelValue).to.deep.equal(['a', 'b', 'c']);
      expect(v.vm.value.split('\n')).to.deep.equal(['a', 'b', 'c']);
      cy.dataCy('list')
        .type('{selectAll}{backspace}')
        .type('d\ne\nf')
        .blur()
        .then(() => {
          expect(v.vm.value.split('\n')).to.deep.equal(['d', 'e', 'f']);
          expect(v.emitted('update:modelValue')[0][0]).to.deep.equal([
            'd',
            'e',
            'f',
          ]);
        });
    });
  });
});
