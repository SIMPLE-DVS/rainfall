<template>
  <q-input
    dense
    hide-bottom-space
    outlined
    :label="param.name"
    v-model="value"
    lazy-rules
    :rules="[
      (val) => (param.is_mandatory ? !!val : true) || 'Field is required',
    ]"
    @change="
      (val) => {
        const newVal = val != '' ? val : null;
        $emit('update:modelValue', newVal);
      }
    "
  ></q-input>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from 'vue';
import { SimpleNodeParameter } from '../models';

export default defineComponent({
  name: 'StringConfigComponent',

  props: {
    modelValue: {
      type: [String, null],
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
    const value = ref(props.modelValue);

    return {
      value,
    };
  },
});
</script>
