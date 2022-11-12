import { mount } from '@cypress/vue';
import { VueWrapper } from '@vue/test-utils';
import TupleConfigComponent from '../TupleConfigComponent.vue';
import { SimpleNodeParameter } from '../../models';
import IntConfigComponent from '../IntConfigComponent.vue';

describe('TupleConfigComponent', () => {
  it('has an initial value and options', () => {
    mount(TupleConfigComponent, {
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
      const v = Cypress.vueWrapper as VueWrapper<
        InstanceType<typeof TupleConfigComponent>
      >;
      expect(v.vm.types).to.have.length(2);
      expect(v.vm.types).to.deep.equal(['int', 'str']);
    });
  });

  it('supports null values', () => {
    mount(TupleConfigComponent, {
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
      const v = Cypress.vueWrapper as VueWrapper<
        InstanceType<typeof TupleConfigComponent>
      >;
      expect(v.vm.types).to.have.length(2);
      expect(v.vm.value).to.deep.equal([null, null]);
    });
  });

  it('changes values', () => {
    mount(TupleConfigComponent, {
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
      const v = Cypress.vueWrapper as VueWrapper<
        InstanceType<typeof TupleConfigComponent>
      >;
      expect(v.vm.types).to.have.length(2);
      cy.dataCy('input')
        .first()
        .then((input) => {
          const i = Cypress.vueWrapper as VueWrapper<
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
