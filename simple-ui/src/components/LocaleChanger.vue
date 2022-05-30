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

<script lang="ts">
import { defineComponent } from 'vue';
import { useI18n } from 'vue-i18n';

export default defineComponent({
  name: 'LocaleChanger',

  setup() {
    const { availableLocales, locale } = useI18n();

    return {
      availableLocales,
      locale,
    };
  },
});
</script>
