<template>
  <q-toggle
    dense
    :label="param.name"
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :toggle-indeterminate="!param.is_mandatory"
  ></q-toggle>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { SimpleNodeParameter } from '../models';

export default defineComponent({
  name: 'BoolConfigComponent',

  props: {
    modelValue: {
      type: [Boolean, null],
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
});
</script>
