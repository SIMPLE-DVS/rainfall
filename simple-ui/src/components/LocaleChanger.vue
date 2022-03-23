<template>
  <q-select
    dense
    outlined
    dark
    :options-dark="false"
    :options="$i18n.availableLocales"
    v-model="$i18n.locale"
  >
  </q-select>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'LocaleChanger',
});
</script>
