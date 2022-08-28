<template>
  <q-input
    dense
    hide-bottom-space
    outlined
    type="textarea"
    :label="param.name"
    v-model="value"
    @keyup.enter.stop
    lazy-rules
    :rules="[
      (val) => (param.is_mandatory ? !!val : true) || 'Field is required',
    ]"
    @change="
      (val) => {
        const newVal = val.trim() !== '' ? splitToRows(val) : null;
        value = newVal != null ? newVal.join('\n') : null;
        $emit('update:modelValue', newVal);
      }
    "
    data-cy="list"
  />
</template>

<script setup lang="ts">
import { ref, toRaw } from 'vue';
import { ComponentTypeRegexes, SimpleNodeParameter } from '../models';

const props = defineProps<{
  modelValue: Array<unknown> | null;
  param: SimpleNodeParameter;
  nodeName: string;
}>();

const paramType = toRaw(props.param.type);
const listRegexResult = ComponentTypeRegexes.get('List')
  .exec(paramType)
  .slice(1);
const listType = listRegexResult.find((r) => !!r);

const value = ref(
  props.modelValue != null
    ? (props.modelValue as Array<unknown>).join('\n')
    : ''
);

const conversionCheckFunctions = new Map<string, (s: string) => boolean>([
  ['str', (x) => x.trim() !== ''],
  ['bool', (x) => /^true$/i.test(x) || /^false$/i.test(x)],
  ['int', (x) => x.trim() !== '' && !Number.isNaN(Number(x))],
  ['float', (x) => x.trim() !== '' && !Number.isNaN(Number(x))],
]);

const conversionMapFunctions = new Map<string, (s: string) => unknown>([
  ['str', (x) => x],
  ['bool', (x) => /^true$/i.test(x)],
  ['int', (x) => Number.parseInt(x)],
  ['float', (x) => Number.parseFloat(x)],
]);

const splitToRows = (data: string) => {
  return data
    .split(/\r\n|\n\r|\n|\r/)
    .filter((x) => conversionCheckFunctions.get(listType)(x))
    .map((x) => conversionMapFunctions.get(listType)(x));
};

defineExpose({ value });
</script>
