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
  />
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { ComponentTypeRegexes, SimpleNodeParameter } from '../models';

export default defineComponent({
  name: 'ListConfigComponent',

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
    const paramType = (props.param as SimpleNodeParameter).type;
    const listRegexResult = ComponentTypeRegexes.get('List')
      .exec(paramType)
      .slice(1);
    const listType = listRegexResult.find((r) => !!r);

    const value = ref(
      props.modelValue != null
        ? (props.modelValue as Array<unknown>).join('\n')
        : ''
    );

    const conversionCheckFunctions = new Map<string, (s: string) => boolean>();
    conversionCheckFunctions.set('str', (x) => x.trim() !== '');
    conversionCheckFunctions.set(
      'bool',
      (x) => /^true$/i.test(x) || /^false$/i.test(x)
    );
    conversionCheckFunctions.set(
      'int',
      (x) => x.trim() !== '' && !Number.isNaN(Number(x))
    );
    conversionCheckFunctions.set(
      'float',
      (x) => x.trim() !== '' && !Number.isNaN(Number(x))
    );

    const conversionMapFunctions = new Map<string, (s: string) => unknown>();
    conversionMapFunctions.set('str', (x) => x);
    conversionMapFunctions.set('bool', (x) => /^true$/i.test(x));
    conversionMapFunctions.set('int', (x) => Number.parseInt(x));
    conversionMapFunctions.set('float', (x) => Number.parseFloat(x));

    const splitToRows = (data: string) => {
      return data
        .split(/\r\n|\n\r|\n|\r/)
        .filter((x) => conversionCheckFunctions.get(listType)(x))
        .map((x) => conversionMapFunctions.get(listType)(x));
    };

    return {
      value,
      splitToRows,
    };
  },
});
</script>
