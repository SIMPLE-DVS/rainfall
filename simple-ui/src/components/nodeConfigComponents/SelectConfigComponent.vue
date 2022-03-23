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
  ></q-select>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { SimpleNodeParameter } from '../models';

export default defineComponent({
  name: 'SelectConfigComponent',

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
    const options = (props.param as SimpleNodeParameter).type
      .slice(1)
      .slice(0, -1)
      .replace(/, /g, ',')
      .split(',');

    const value = ref(props.modelValue);

    return {
      value,
      options,
    };
  },
});
</script>
