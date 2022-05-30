<template>
  <div>
    <q-select
      dense
      options-dense
      hide-bottom-space
      outlined
      label="type"
      v-model="type"
      :options="[...ManageableComponentTypes.keys()]"
      lazy-rules
      :rules="[
        (val) => (param.is_mandatory ? !!val : true) || 'Field is required',
      ]"
      @update:model-value="
        newParam.type = $event;
        value = null;
        updateConfig();
        updateKey++;
      "
    ></q-select>
    <component
      v-if="type != null"
      :key="updateKey"
      :is="ManageableComponentTypes.get(type)"
      v-model="value"
      :param="newParam"
      :nodeName="nodeName"
      @update:model-value="
        $emit('update:modelValue', $event);
        updateConfig();
        updateKey++;
      "
    ></component>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from 'vue';
import { ManageableComponentTypes, SimpleNodeParameter } from '../models';
import StringConfigComponent from './StringConfigComponent.vue';
import BoolConfigComponent from './BoolConfigComponent.vue';
import IntConfigComponent from './IntConfigComponent.vue';
import FloatConfigComponent from './FloatConfigComponent.vue';
import ListConfigComponent from './ListConfigComponent.vue';
import { useConfigStore } from 'stores/configStore';

export default defineComponent({
  name: 'AnyConfigComponent',

  components: {
    StringConfigComponent,
    BoolConfigComponent,
    IntConfigComponent,
    FloatConfigComponent,
    ListConfigComponent,
  },

  props: {
    modelValue: {
      required: true,
    },
    param: {
      type: Object as PropType<SimpleNodeParameter>,
      required: true,
    },
    nodeName: {
      type: String,
      required: true,
    },
  },

  setup(props) {
    const configStore = useConfigStore();
    const parameterName = `${props.nodeName}$${props.param.name}`;
    const type = ref(configStore.nodeAnyConfigs.get(parameterName));
    const value = ref(props.modelValue);
    const updateKey = ref(0);
    const newParam = { ...props.param };
    newParam.type = type.value;

    const updateConfig = () => {
      configStore.nodeAnyConfigs.set(parameterName, type.value);
      configStore.nodeConfigs.get(props.nodeName)[props.param.name] = value;
    };

    return {
      type,
      ManageableComponentTypes,
      value,
      updateKey,
      newParam,
      updateConfig,
    };
  },
});
</script>
