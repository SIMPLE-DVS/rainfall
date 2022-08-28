<template>
  <q-input
    dense
    hide-bottom-space
    outlined
    :label="param.name"
    v-model="value"
    lazy-rules
    :rules="[
      (val) =>
        (param.is_mandatory ? val != null && val !== '' : true) ||
        'Field is required',
    ]"
    @change="
      (val) => {
        const newVal =
          val.trim() !== '' && !Number.isNaN(Number(val))
            ? Number.parseFloat(val)
            : null;
        value = newVal;
        $emit('update:modelValue', newVal);
      }
    "
    data-cy="input"
  ></q-input>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { SimpleNodeParameter } from '../models';

const props = defineProps<{
  modelValue: number | null;
  param: SimpleNodeParameter;
  nodeName: string;
}>();

const value = ref(props.modelValue != null ? props.modelValue.toString() : '');

defineExpose({ value });
</script>
