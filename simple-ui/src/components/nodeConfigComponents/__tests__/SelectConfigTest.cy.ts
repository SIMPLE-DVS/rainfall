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
