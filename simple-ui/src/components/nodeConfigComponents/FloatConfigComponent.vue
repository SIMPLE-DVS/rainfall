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
            ? Number.parseFloat(val)
            : null;
        value = newVal;
        $emit('update:modelValue', newVal);
      }
    "
    data-cy="input"
  ></q-input>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { SimpleNodeParameter } from '../models';

const props = defineProps<{
  modelValue: number | null;
  param: SimpleNodeParameter;
  nodeName: string;
}>();

const value = ref(props.modelValue != null ? props.modelValue.toString() : '');

defineExpose({ value });
</script>
