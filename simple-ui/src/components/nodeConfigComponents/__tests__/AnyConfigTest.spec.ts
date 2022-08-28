import { mount } from '@cypress/vue';
import { VueWrapper } from '@vue/test-utils';
import AnyConfigComponent from '../AnyConfigComponent.vue';
import { SimpleNodeParameter } from '../../models';
import { useConfigStore } from 'src/stores/configStore';
import IntConfigComponent from '../IntConfigComponent.vue';

// TODO: fix circular dependency: AnyConfigComponent -> src/components/models.ts -> AnyConfigComponent
describe('AnyConfigComponent', () => {
  let configStore: ReturnType<typeof useConfigStore>;
  beforeEach(() => {
    configStore = useConfigStore();
    configStore.clearNodeConfigs();
    configStore.clearNodeStructures();
  });

  it('has an initial value', () => {
    mount(AnyConfigComponent, {
      props: {
        modelValue: 5,
        param: { name: 'param' } as SimpleNodeParameter,
        nodeName: 'node',
      },
    });
    configStore.nodeConfigs.set('node', { param: 5 });
    configStore.nodeAnyConfigs.set('node$param', 'int');
    cy.dataCy('input').then((input) => {
      const v = Cypress.vueWrapper as VueWrapper<
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
    mount(AnyConfigComponent, {
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
    mount(AnyConfigComponent, {
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
