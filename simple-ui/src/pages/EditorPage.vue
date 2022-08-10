<template>
  <q-page>
    <ace-editor :nodePackage="nodePackage"></ace-editor>
  </q-page>
</template>

<script setup lang="ts">
import AceEditor from '../components/custom/AceEditor.vue';

defineProps<{
  nodePackage?: string;
}>();
</script>
