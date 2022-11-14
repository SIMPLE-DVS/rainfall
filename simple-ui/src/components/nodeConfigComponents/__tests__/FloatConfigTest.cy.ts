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
