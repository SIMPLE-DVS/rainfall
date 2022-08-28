import { mount } from '@cypress/vue';
import { VueWrapper } from '@vue/test-utils';
import StringConfigComponent from '../StringConfigComponent.vue';
import { SimpleNodeParameter } from '../../models';

describe('StringConfigComponent', () => {
  it('has an initial value', () => {
    mount(StringConfigComponent, {
      props: {
        modelValue: 'abc',
        param: {} as SimpleNodeParameter,
        nodeName: 'node',
      },
    });
    cy.dataCy('input').then((input) => {
      const v = Cypress.vueWrapper as VueWrapper<
        InstanceType<typeof StringConfigComponent>
      >;
      expect(v.vm.value).to.equal('abc');
      cy.wrap(input)
        .type('de')
        .then(() => {
          expect(v.vm.value).to.equal('abcde');
          cy.wrap(input)
            .blur()
            .then(() => {
              expect(v.emitted('update:modelValue')[0][0]).to.equal('abcde');
            });
        });
    });
  });

  it('supports null value', () => {
    mount(StringConfigComponent, {
      props: {
        modelValue: null,
        param: {} as SimpleNodeParameter,
        nodeName: 'node',
      },
    });

    cy.dataCy('input').then(() => {
      const v = Cypress.vueWrapper as VueWrapper<
        InstanceType<typeof StringConfigComponent>
      >;
      expect(v.vm.value).to.equal(null);
    });
  });

  it('requires a value if the parameter is mandatory', () => {
    mount(StringConfigComponent, {
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
