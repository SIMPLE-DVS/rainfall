<template>
  <q-layout view="hHh LpR fFf">
    <q-header elevated bordered>
      <q-toolbar>
        <q-btn
          v-if="tab == 'ui' || tab == 'editor'"
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
          data-cy="leftDrawer"
        />

        <q-toolbar-title> Flow UI </q-toolbar-title>

        <q-space></q-space>

        <locale-changer></locale-changer>

        <q-btn
          v-if="tab == 'ui' && selectedNodes.length == 1"
          dense
          flat
          round
          icon="menu"
          @click="toggleRightDrawer"
          data-cy="rightDrawer"
        />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      overlay
      bordered
      elevated
      behavior="desktop"
      side="left"
    >
      <node-collection v-if="tab == 'ui'"></node-collection>
      <custom-node-collection
        v-else-if="tab == 'editor'"
      ></custom-node-collection>
    </q-drawer>

    <q-drawer
      v-model="rightDrawerOpen"
      overlay
      bordered
      elevated
      behavior="desktop"
      side="right"
    >
      <config-form-component
        v-if="selectedNodes.length == 1"
        :key="resetKey"
        :node="selectedNodes[0]"
        @resetNode="resetKey++"
      ></config-form-component>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer elevated bordered class="bg-grey-10">
      <q-toolbar>
        <q-space></q-space>

        <q-tabs
          v-model="tab"
          inline-label
          indicator-color="secondary"
          active-bg-color="primary"
        >
          <q-route-tab
            name="ui"
            default="true"
            icon="architecture"
            label="UI"
            :to="{ name: 'canvas' }"
          />
          <q-route-tab
            name="editor"
            icon="mode_edit"
            label="Custom"
            :to="{ name: 'editor' }"
          />
          <q-route-tab
            name="execution"
            icon="directions_run"
            label="Execution"
            :to="{ name: 'execution' }"
          />
          <q-route-tab
            name="import_export"
            icon="import_export"
            label="Import/Export"
            :to="{ name: 'import_export' }"
          />
        </q-tabs>

        <q-space></q-space>
      </q-toolbar>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import LocaleChanger from 'components/LocaleChanger.vue';
import NodeCollection from 'components/NodeCollection.vue';
import CustomNodeCollection from 'components/custom/CustomNodeCollection.vue';
import ConfigFormComponent from 'components/ConfigFormComponent.vue';
import { useCanvasStore } from 'stores/canvasStore';
import { NodeInfo } from 'components/models';

const canvasStore = useCanvasStore();
const leftDrawerOpen = ref(false);
const rightDrawerOpen = ref(false);
const tab = ref('ui');
const resetKey = ref(0);
const selectedNodes = ref([] as NodeInfo[]);

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value;
};

const toggleRightDrawer = () => {
  rightDrawerOpen.value = !rightDrawerOpen.value;
};

watch(
  () => canvasStore.selectedNodes,
  (newVal) => {
    selectedNodes.value = newVal;
    if (newVal.length != 1) {
      rightDrawerOpen.value = false;
    }
  },
  { deep: true }
);

watch(
  () => canvasStore.doubleClick,
  () => {
    canvasStore.doubleClick = false;
    if (canvasStore.selectedNodes.length == 1) {
      rightDrawerOpen.value = true;
    }
  }
);
</script>
