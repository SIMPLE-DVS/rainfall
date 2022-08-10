<template>
  <q-select
    dense
    outlined
    dark
    :options-dark="$q.dark.isActive"
    :options="availableLocales"
    v-model="locale"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { availableLocales, locale } = useI18n();
</script>
