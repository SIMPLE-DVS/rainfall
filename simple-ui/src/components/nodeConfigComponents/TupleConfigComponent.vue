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
          [
            (value[k] = $event),
            $emit('update:modelValue', value),
            updateKeys[k]++,
          ]
        "
      >
      </component>
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
import { ref, toRaw } from 'vue';
import {
  ComponentTypeRegexes,
  ManageableComponentTypes,
  SimpleNodeParameter,
} from '../models';

const props = defineProps<{
  modelValue: Array<unknown> | null;
  param: SimpleNodeParameter;
  nodeName: string;
}>();

const paramType = toRaw(props.param.type);

const types = ComponentTypeRegexes.get('Tuple')
  .exec(paramType)[1]
  .toLowerCase()
  .replace(/, /g, ',')
  .split(',');

const value = ref(
  props.modelValue != null ? props.modelValue : Array(types.length).fill(null)
);

const updateKeys = ref(Array(types.length).fill(0));
</script>
