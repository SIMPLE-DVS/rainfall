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
        updateAnyConfig();
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
        updateAnyConfig();
        updateKey++;
      "
    ></component>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import {
  AnyParameterConfig,
  ManageableComponentTypes,
  SimpleNodeParameter,
} from '../models';
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
      type: Object,
      required: true,
    },
    nodeName: {
      type: String,
      required: true,
    },
  },

  setup(props) {
    const configStore = useConfigStore();

    const previousConfig: AnyParameterConfig = configStore.nodeAnyConfigs.get(
      `${props.nodeName}$${props.param.name as string}`
    );

    const type = ref(previousConfig.type);
    const value = ref(previousConfig.value);
    const updateKey = ref(0);
    const newParam = { ...(props.param as SimpleNodeParameter) };
    newParam.type = type.value;

    const updateAnyConfig = () => {
      previousConfig.type = type.value;
      previousConfig.value = value.value;
    };

    return {
      type,
      ManageableComponentTypes,
      value,
      updateKey,
      newParam,
      updateAnyConfig,
    };
  },
});
</script>
