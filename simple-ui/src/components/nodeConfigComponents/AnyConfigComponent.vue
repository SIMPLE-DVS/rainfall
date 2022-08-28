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
      data-cy="select"
    ></q-select>
    <component
      v-if="type != null"
      :key="updateKey"
      :is="ManageableComponentTypes.get(type)"
      v-model="value"
      :param="newParam"
      :nodeName="nodeName"
      @update:model-value="
        [$emit('update:modelValue', $event), updateConfig(), updateKey++]
      "
    ></component>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ManageableComponentTypes, SimpleNodeParameter } from '../models';
import { useConfigStore } from 'stores/configStore';

const props = defineProps<{
  modelValue: unknown;
  param: SimpleNodeParameter;
  nodeName: string;
}>();

const configStore = useConfigStore();
const parameterName = `${props.nodeName}$${props.param.name}`;
const type = ref(configStore.nodeAnyConfigs.get(parameterName));
const value = ref(props.modelValue);
const updateKey = ref(0);
const newParam = { ...props.param, type: type.value };

const updateConfig = () => {
  configStore.nodeAnyConfigs.set(parameterName, type.value);
  configStore.nodeConfigs.get(props.nodeName)[props.param.name] = value;
};
</script>
