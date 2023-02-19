<!--
 Copyright (C) 2023 Università degli Studi di Camerino and Sigma S.p.A.
 Authors: Alessandro Antinori, Rosario Capparuccia, Riccardo Coltrinari, Flavio Corradini, Marco Piangerelli, Barbara Re, Marco Scarpetta

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as
 published by the Free Software Foundation, either version 3 of the
 License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this program.  If not, see <https://www.gnu.org/licenses/>.
 -->

<template>
  <q-list dense data-cy="tuple">
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

defineExpose({ types, value });
</script>
