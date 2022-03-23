<template>
  <q-toggle
    dense
    :label="param.name"
    v-model="value"
    @update:model-value="$emit('update:modelValue', $event)"
    :toggle-indeterminate="!param.is_mandatory"
  ></q-toggle>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'BoolConfigComponent',

  props: {
    modelValue: {
      required: true,
    },
    param: {
      required: true,
    },
    nodeName: {
      type: String,
      required: true,
    },
  },

  setup(props) {
    const value = ref(props.modelValue);

    return {
      value,
    };
  },
});
</script>
