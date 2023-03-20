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
  <q-select
    dense
    options-dense
    hide-bottom-space
    outlined
    :label="param.name"
    v-model="value"
    :multiple="multiple"
    :options="options"
    lazy-rules
    :rules="[
      (val) => (param.is_mandatory ? !!val : true) || 'Field is required',
    ]"
    @update:model-value="$emit('update:modelValue', $event)"
    data-cy="select"
  ></q-select>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { SimpleNodeParameter } from '../models';

const props = defineProps<{
  modelValue: unknown;
  param: SimpleNodeParameter;
  nodeName: string;
}>();

const options = props.param.type
  .slice(1)
  .slice(0, -1)
  .replace(/, /g, ',')
  .split(',');

const multiple = props.param.type.startsWith('[');

const value = ref(props.modelValue);

defineExpose({ options, value });
</script>
