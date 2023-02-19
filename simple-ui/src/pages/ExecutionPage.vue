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
  <q-page>
    <q-splitter class="absolute-full" v-model="splitterModel">
      <template v-slot:before>
        <execution-canvas></execution-canvas>
      </template>
      <template v-slot:separator>
        <q-avatar
          color="primary"
          text-color="white"
          size="40px"
          icon="drag_indicator"
        />
      </template>
      <template v-slot:after>
        <execution-panel> </execution-panel>
      </template>
    </q-splitter>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ExecutionCanvas from '../components/execution/ExecutionCanvas.vue';
import ExecutionPanel from '../components/execution/ExecutionPanel.vue';

const splitterModel = ref(66);
</script>
