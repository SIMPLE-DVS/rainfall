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
import AnyConfigComponent from '../AnyConfigComponent.vue';
import { SimpleNodeParameter } from '../../models';
import { useConfigStore } from 'src/stores/configStore';
import IntConfigComponent from '../IntConfigComponent.vue';

describe('AnyConfigComponent', () => {
  let configStore: ReturnType<typeof useConfigStore>;
  beforeEach(() => {
    configStore = useConfigStore();
    configStore.clearNodeConfigs();
    configStore.clearNodeStructures();
  });

  it('has an initial value', () => {
    cy.mount(AnyConfigComponent, {
      props: {
        modelValue: 5,
        param: { name: 'param' } as SimpleNodeParameter,
        nodeName: 'node',
      },
    });
    configStore.nodeConfigs.set('node', { param: 5 });
    configStore.nodeAnyConfigs.set('node$param', 'int');
    cy.dataCy('input').then((input) => {
      const v = Cypress.vueWrapper as unknown as VueWrapper<
        InstanceType<typeof IntConfigComponent>
      >;
      expect(v.vm.value).to.equal(5);
      cy.wrap(input)
        .type('4')
        .blur()
        .then(() => {
          expect(v.vm.value).to.equal(54);
          expect(configStore.nodeConfigs.get('node')['param']).to.equal(54);
          cy.wrap(input).then(() => {
            expect(v.emitted('update:modelValue')[0][0]).to.equal(54);
          });
        });
    });
  });

  it('supports null values', () => {
    cy.mount(AnyConfigComponent, {
      props: {
        modelValue: null,
        param: { name: 'param' } as SimpleNodeParameter,
        nodeName: 'node',
      },
    });
    configStore.nodeConfigs.set('node', { param: null });
    expect(configStore.nodeAnyConfigs.size).to.equal(0);
    cy.dataCy('select')
      .select('int')
      .then(() => {
        expect(configStore.nodeAnyConfigs.size).to.equal(1);
        expect([...configStore.nodeAnyConfigs.keys()]).to.contain('node$param');
        expect(configStore.nodeConfigs.get('node')['param']).to.be.null;
        expect(configStore.nodeAnyConfigs.get('node$param')).to.equal('int');
        cy.dataCy('input').then((input) => {
          cy.wrap(input)
            .type('5')
            .blur()
            .then(() => {
              expect(configStore.nodeConfigs.get('node')['param']).to.equal(5);
            });
        });
      });
  });

  it('changes values', () => {
    cy.mount(AnyConfigComponent, {
      props: {
        modelValue: 123,
        param: { name: 'param' } as SimpleNodeParameter,
        nodeName: 'node',
      },
    });
    configStore.nodeConfigs.set('node', { param: 123 });
    configStore.nodeAnyConfigs.set('node$param', 'int');
    expect(configStore.nodeConfigs.get('node')['param']).to.equal(123);
    expect(configStore.nodeAnyConfigs.get('node$param')).to.equal('int');
    cy.dataCy('select')
      .select('bool')
      .then(() => {
        expect(configStore.nodeConfigs.get('node')['param']).to.be.null;
        expect(configStore.nodeAnyConfigs.get('node$param')).to.equal('bool');
        cy.dataCy('toggle')
          .check()
          .then(() => {
            expect(configStore.nodeConfigs.get('node')['param']).to.equal(true);
          });
      });
  });
});
