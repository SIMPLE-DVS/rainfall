<template>
  <q-select
    dense
    options-dense
    hide-bottom-space
    outlined
    :label="param.name"
    v-model="value"
    :options="options"
    lazy-rules
    :rules="[
      (val) => (param.is_mandatory ? !!val : true) || 'Field is required',
    ]"
    @update:model-value="$emit('update:modelValue', $event)"
    data-cy="select"
  ></q-select>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { SimpleNodeParameter } from '../models';

const props = defineProps<{
  modelValue: unknown;
  param: SimpleNodeParameter;
  nodeName: string;
}>();

const options = props.param.type
  .slice(1)
  .slice(0, -1)
  .replace(/, /g, ',')
  .split(',');

const value = ref(props.modelValue);

defineExpose({ options, value });
</script>
