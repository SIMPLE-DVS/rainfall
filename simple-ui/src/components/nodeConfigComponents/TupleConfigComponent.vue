<template>
  <q-list dense>
    <q-item class="column" v-for="(t, k) in types" :key="t">
      <component
        class="q-py-xs"
        :key="updateKeys[k]"
        :is="ManageableComponentTypes.get(t)"
        v-model="value[k]"
        :param="{
          name: param.name + '_attr_' + k,
          type: t,
          is_mandatory: param.is_mandatory,
        }"
        :nodeName="nodeName"
        @update:model-value="
          value[k] = $event;
          $emit('update:modelValue', value);
          updateKeys[k]++;
        "
      >
      </component>
    </q-item>
  </q-list>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import {
  ComponentTypeRegexes,
  ManageableComponentTypes,
  SimpleNodeParameter,
} from '../models';
import StringConfigComponent from './StringConfigComponent.vue';
import BoolConfigComponent from './BoolConfigComponent.vue';
import IntConfigComponent from './IntConfigComponent.vue';
import FloatConfigComponent from './FloatConfigComponent.vue';
import ListConfigComponent from './ListConfigComponent.vue';

export default defineComponent({
  name: 'TupleConfigComponent',

  components: {
    StringConfigComponent,
    BoolConfigComponent,
    IntConfigComponent,
    FloatConfigComponent,
    ListConfigComponent,
  },

  props: {
    modelValue: {
      required: true,
    },
    param: {
      type: Object,
      required: true,
    },
    nodeName: {
      type: String,
      required: true,
    },
  },

  setup(props) {
    const paramType = (props.param as SimpleNodeParameter).type;

    const types = ComponentTypeRegexes.get('Tuple')
      .exec(paramType)[1]
      .toLowerCase()
      .replace(/, /g, ',')
      .split(',');

    const value = ref(
      props.modelValue != null
        ? props.modelValue
        : Array(types.length).fill(null)
    );

    const updateKeys = ref(Array(types.length).fill(0));

    return {
      types,
      ManageableComponentTypes,
      value,
      updateKeys,
    };
  },
});
</script>
