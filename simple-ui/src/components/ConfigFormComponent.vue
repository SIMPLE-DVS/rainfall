<template>
  <q-scroll-area
    style="width: 100%; height: 100%; position: absolute"
    :key="node.name"
  >
    <div class="q-pa-sm row justify-center">
      <q-chip outline size="lg" text-color="primary">
        {{ node.name }}
      </q-chip>
    </div>

    <div class="q-px-md">
      {{ nodeDescription }}
    </div>

    <q-separator color="primary" inset spaced />

    <div v-if="node.package.includes('rain.nodes.custom.custom.CustomNode')">
      <div class="row justify-center">
        <q-btn
          label="Edit"
          color="primary"
          icon="edit"
          @click="editCustomNode(node)"
        ></q-btn>
      </div>

      <q-separator color="primary" inset spaced />
    </div>

    <q-list dense>
      <q-item-label header class="row justify-center"
        >Node Configuration</q-item-label
      >
      <q-item
        class="q-pa-sm column"
        v-for="(v, k) in nodeConfigStructure"
        :key="k"
      >
        <q-item-section>
          <q-item-label
            ><b>{{ k }}:</b> <i>{{ v.type }}</i></q-item-label
          >
          <q-item-label caption>{{ v.description }}</q-item-label>
        </q-item-section>
        <q-item-section side v-if="v.is_mandatory">
          <q-badge color="negative">Required</q-badge>
        </q-item-section>
        <component
          class="q-py-xs q-pb-md"
          :is="nodeConfigComponents.get(k)"
          v-model="nodeConfigData[k]"
          :param="v"
          :nodeName="node.name"
        >
        </component>
      </q-item>
    </q-list>

    <q-separator color="primary" inset spaced />

    <div class="q-pb-sm row justify-center">
      <q-btn
        label="Reset to default"
        color="primary"
        @click="
          configStore.setNodeConfig(node);
          $emit('resetNode');
        "
      ></q-btn>
    </div>
  </q-scroll-area>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, Ref, watch } from 'vue';
import { useConfigStore } from 'stores/configStore';
import { useCustomStore } from 'stores/customStore';
import { FabricNode } from './fabricModels';
import {
  ComponentTypeRegexes,
  CustomNodeStructure,
  NodeInfo,
  SimpleNodeParameter,
} from './models';
import StringConfigComponent from './nodeConfigComponents/StringConfigComponent.vue';
import BoolConfigComponent from './nodeConfigComponents/BoolConfigComponent.vue';
import IntConfigComponent from './nodeConfigComponents/IntConfigComponent.vue';
import FloatConfigComponent from './nodeConfigComponents/FloatConfigComponent.vue';
import ListConfigComponent from './nodeConfigComponents/ListConfigComponent.vue';
import SelectConfigComponent from './nodeConfigComponents/SelectConfigComponent.vue';
import AnyConfigComponent from './nodeConfigComponents/AnyConfigComponent.vue';
import TupleConfigComponent from './nodeConfigComponents/TupleConfigComponent.vue';

export default defineComponent({
  name: 'ConfigFormComponent',

  components: {
    StringConfigComponent,
    BoolConfigComponent,
    IntConfigComponent,
    FloatConfigComponent,
    ListConfigComponent,
    SelectConfigComponent,
    AnyConfigComponent,
    TupleConfigComponent,
  },

  props: {
    node: {
      type: Object as PropType<NodeInfo>,
      required: true,
    },
  },

  setup(props) {
    const configStore = useConfigStore();
    const customStore = useCustomStore();
    const nodeDescription: Ref<string> = ref('');
    const nodeConfigStructure: Ref<{ [index: string]: unknown }> = ref({});
    const nodeConfigComponents: Ref<Map<string, string>> = ref();
    const nodeConfigData: Ref<{ [index: string]: unknown }> = ref({});

    watch(
      () => props.node,
      (newVal) => {
        (document.activeElement as HTMLElement)?.blur();
        updateNode(newVal);
      }
    );

    const updateNode = (node: NodeInfo) => {
      const nodeStructure = configStore.getNodeStructureByNodePackage(
        node.package
      );
      nodeDescription.value = nodeStructure.description;
      nodeConfigStructure.value = nodeStructure.parameter.reduce(
        (acc, value) => Object.assign(acc, { [value.name]: value }),
        {}
      );
      nodeConfigComponents.value = new Map<string, string>(
        Object.entries(nodeConfigStructure.value).map((v) => [
          v[0],
          getConfigComponent((v[1] as SimpleNodeParameter).type),
        ])
      );
      nodeConfigData.value = configStore.nodeConfigs.get(node.name);
    };

    const getConfigComponent = (type: string) => {
      let component = 'q-input';
      for (const [k, v] of ComponentTypeRegexes) {
        if (v.test(type)) {
          component = k + 'ConfigComponent';
          break;
        }
      }
      return component;
    };

    const editCustomNode = (node: FabricNode) => {
      const structure = configStore.getNodeStructureByNodePackage(
        node.nodePackage
      ) as CustomNodeStructure;
      customStore.name = node.name;
      customStore.function_name = structure.function_name;
      customStore.code = structure.code;
      customStore.editMode = true;
      customStore.nodeToEdit = node.name;
    };

    updateNode(props.node);

    return {
      configStore,
      nodeDescription,
      nodeConfigStructure,
      nodeConfigComponents,
      nodeConfigData,
      editCustomNode,
    };
  },
});
</script>
