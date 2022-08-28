import { mount } from '@cypress/vue';
import { VueWrapper } from '@vue/test-utils';
import IntConfigComponent from '../IntConfigComponent.vue';
import { SimpleNodeParameter } from '../../models';

describe('IntConfigComponent', () => {
  it('has an initial value', () => {
    mount(IntConfigComponent, {
      props: {
        modelValue: 123,
        param: {} as SimpleNodeParameter,
        nodeName: 'node',
      },
    });
    cy.dataCy('input').then((input) => {
      const v = Cypress.vueWrapper as VueWrapper<
        InstanceType<typeof IntConfigComponent>
      >;
      expect(v.vm.value).to.equal('123');
      cy.wrap(input)
        .type('45')
        .then(() => {
          expect(v.vm.value).to.equal('12345');
          cy.wrap(input)
            .blur()
            .then(() => {
              expect(v.emitted('update:modelValue')[0][0]).to.equal(12345);
            });
        });
    });
  });

  it('supports null value', () => {
    mount(IntConfigComponent, {
      props: {
        modelValue: null,
        param: {} as SimpleNodeParameter,
        nodeName: 'node',
      },
    });

    cy.dataCy('input').then(() => {
      const v = Cypress.vueWrapper as VueWrapper<
        InstanceType<typeof IntConfigComponent>
      >;
      expect(v.vm.value).to.equal('');
    });
  });

  it('converts values if needed', () => {
    mount(IntConfigComponent, {
      props: {
        modelValue: null,
        param: {} as SimpleNodeParameter,
        nodeName: 'node',
      },
    });

    cy.dataCy('input').then((input) => {
      const v = Cypress.vueWrapper as VueWrapper<
        InstanceType<typeof IntConfigComponent>
      >;
      cy.wrap(input)
        .type('1.23')
        .blur()
        .then(() => {
          expect(v.emitted('update:modelValue')[0][0]).to.equal(1);
        });
    });
  });

  it('requires a value if the parameter is mandatory', () => {
    mount(IntConfigComponent, {
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
