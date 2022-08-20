<template>
  <q-btn @click="onClick"> Click me! </q-btn>
</template>

<script setup lang="ts">
import { Notify } from 'quasar';

function onClick() {
  Notify.create('Hello there!');
}
</script>
