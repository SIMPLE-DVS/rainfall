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
  <div>
    <q-select
      dense
      options-dense
      hide-bottom-space
      outlined
      label="type"
      v-model="type"
      :options="[...ManageableComponentTypes.keys()]"
      lazy-rules
      :rules="[
        (val) => (param.is_mandatory ? !!val : true) || 'Field is required',
      ]"
      @update:model-value="
        newParam.type = $event;
        value = null;
        updateConfig();
        updateKey++;
      "
      data-cy="select"
    ></q-select>
    <component
      v-if="type != null"
      :key="updateKey"
      :is="ManageableComponentTypes.get(type)"
      v-model="value"
      :param="newParam"
      :nodeName="nodeName"
      @update:model-value="
        [$emit('update:modelValue', $event), updateConfig(), updateKey++]
      "
    ></component>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ManageableComponentTypes, SimpleNodeParameter } from '../models';
import { useConfigStore } from 'stores/configStore';

const props = defineProps<{
  modelValue: unknown;
  param: SimpleNodeParameter;
  nodeName: string;
}>();

const configStore = useConfigStore();
const parameterName = `${props.nodeName}$${props.param.name}`;
const type = ref(configStore.nodeAnyConfigs.get(parameterName));
const value = ref(props.modelValue);
const updateKey = ref(0);
const newParam = { ...props.param, type: type.value };

const updateConfig = () => {
  configStore.nodeAnyConfigs.set(parameterName, type.value);
  configStore.nodeConfigs.get(props.nodeName)[props.param.name] = value;
};
</script>
