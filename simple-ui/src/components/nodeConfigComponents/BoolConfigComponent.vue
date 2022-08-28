<template>
  <q-toggle
    dense
    :label="param.name"
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :toggle-indeterminate="!param.is_mandatory"
    data-cy="toggle"
  ></q-toggle>
</template>

<script setup lang="ts">
import { SimpleNodeParameter } from '../models';

defineProps<{
  modelValue: boolean | null;
  param: SimpleNodeParameter;
  nodeName: string;
}>();
</script>
