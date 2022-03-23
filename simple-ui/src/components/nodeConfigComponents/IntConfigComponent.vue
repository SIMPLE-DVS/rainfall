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
            ? Number.parseInt(val)
            : null;
        value = newVal;
        $emit('update:modelValue', newVal);
      }
    "
  ></q-input>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'IntConfigComponent',

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
    const value = ref(
      props.modelValue != null ? props.modelValue.toString() : ''
    );

    return {
      value,
    };
  },
});
</script>
