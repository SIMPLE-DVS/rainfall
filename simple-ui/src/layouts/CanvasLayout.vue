<template>
  <q-layout view="hHh LpR fFf">
    <q-header elevated bordered class="bg-primary text-white">
      <q-toolbar>
        <q-btn
          v-if="tab == 'ui' || tab == 'editor'"
          dense
          flat
          round
          icon="menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title> Flow UI </q-toolbar-title>

        <q-space></q-space>

        <q-toggle
          v-model="canvasStore.canvasGrid"
          color="black"
          icon="grid_on"
          left-label
          label="Enable/Disable Grid"
        />

        <locale-changer></locale-changer>

        <q-btn
          v-if="tab == 'ui' && selectedNodes.length == 1"
          dense
          flat
          round
          icon="menu"
          @click="toggleRightDrawer"
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
      <custom-collection v-else-if="tab == 'editor'"></custom-collection>
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

    <q-footer elevated bordered class="bg-grey-10 text-white">
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

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import LocaleChanger from 'components/LocaleChanger.vue';
import NodeCollection from 'components/NodeCollection.vue';
import CustomCollection from 'components/custom/CustomCollection.vue';
import ConfigFormComponent from 'components/ConfigFormComponent.vue';
import { useCanvasStore } from 'stores/canvasStore';
import { NodeInfo } from 'src/components/models';

export default defineComponent({
  name: 'CanvasLayout',

  components: {
    LocaleChanger,
    NodeCollection,
    CustomCollection,
    ConfigFormComponent,
  },

  setup() {
    const canvasStore = useCanvasStore();
    const leftDrawerOpen = ref(false);
    const rightDrawerOpen = ref(false);
    const selectedNodes = ref([] as NodeInfo[]);

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

    return {
      leftDrawerOpen,
      toggleLeftDrawer() {
        leftDrawerOpen.value = !leftDrawerOpen.value;
      },

      rightDrawerOpen,
      toggleRightDrawer() {
        rightDrawerOpen.value = !rightDrawerOpen.value;
      },

      tab: ref('ui'),
      selectedNodes,
      resetKey: ref(0),
      canvasStore,
    };
  },
});
</script>
