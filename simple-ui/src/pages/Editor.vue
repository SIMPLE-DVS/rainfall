<template>
  <q-page>
    <ace-editor :nodePackage="nodePackage"></ace-editor>
  </q-page>
</template>

<script lang="ts">
import AceEditor from '../components/custom/AceEditor.vue';

export default {
  name: 'PageEditor',

  components: { AceEditor },

  props: {
    nodePackage: {
      type: String,
      required: false,
    },
  },
};
</script>
