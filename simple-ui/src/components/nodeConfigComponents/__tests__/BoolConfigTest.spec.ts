import { mount } from '@cypress/vue';
import { VueWrapper } from '@vue/test-utils';
import BoolConfigComponent from '../BoolConfigComponent.vue';
import { SimpleNodeParameter } from '../../models';

describe('BoolConfigComponent', () => {
  it('has an initial value', () => {
    mount(BoolConfigComponent, {
      props: {
        modelValue: true,
        param: {} as SimpleNodeParameter,
        nodeName: 'node',
      },
    });
    cy.dataCy('toggle').then((toggle) => {
      const v = Cypress.vueWrapper as VueWrapper<
        InstanceType<typeof BoolConfigComponent>
      >;
      expect(v.vm.modelValue).to.be.true;
      cy.wrap(toggle).should('be.checked');
    });
  });

  it('supports null value', () => {
    mount(BoolConfigComponent, {
      props: {
        modelValue: null,
        param: {} as SimpleNodeParameter,
        nodeName: 'node',
      },
    });

    cy.dataCy('toggle').then(() => {
      const v = Cypress.vueWrapper as VueWrapper<
        InstanceType<typeof BoolConfigComponent>
      >;
      expect(v.vm.modelValue).to.equal(null);
      cy.dataCy('toggle')
        .check()
        .then(() => {
          expect(v.emitted('update:modelValue')[0][0]).to.equal(true);
        });
    });
  });
});
