<template>
  <q-page padding>
    <div class="q-pa-md q-gutter-sm">
      <div>{{ $t('executor.current') }}:</div>

      <q-btn
        v-for="exec in currentExecutors"
        :key="exec"
        :label="exec"
        color="primary"
        disabled="true"
      ></q-btn>

      <q-separator inset />

      <div>Model: {{ currentExecutors }}</div>

      <q-list bordered separator>
        <q-item class="q-pa-md" v-for="exec in possibleExecutors" :key="exec">
          <div style="min-width: 100%; max-width: 100%" class="row">
            <q-toggle :label="exec" v-model="currentExecutors" :val="exec" />
            <q-space></q-space>
            <b v-if="currentExecutors.includes(exec)" style="color: green">
              {{ $t('executor.enabled') }}
            </b>
            <b v-else style="color: red">{{ $t('executor.disabled') }}</b>

            <q-expansion-item
              class="fit row justify-center"
              v-if="currentExecutors.includes(exec)"
              expand-separator
              icon="tune"
              :label="$t('executor.fullSetting', { executorName: exec })"
            >
              <q-form
                @submit="saveExecutorSettings"
                class="q-gutter-md justify-center"
              >
                <q-input
                  style="padding-top: 5px"
                  outlined
                  :label="$t('executor.name') + ' *'"
                />
                <q-input outlined :label="$t('executor.setting') + ' 1 *'" />
                <q-input outlined :label="$t('executor.setting') + ' 2 *'" />
                <q-input outlined :label="$t('executor.setting') + ' 3 *'" />

                <q-btn label="Save" color="primary" />
                <q-btn label="Reset" type="reset" color="primary" />
                <q-btn label="Clear" icon="clear" color="secondary" />
              </q-form>
            </q-expansion-item>
          </div>
        </q-item>
      </q-list>

      <q-btn
        :label="$t('executor.next')"
        color="primary"
        :to="{ name: 'export' }"
      />
    </div>
  </q-page>
</template>

<script lang="ts">
import { ref } from 'vue';

export default {
  name: 'PageExecutor',

  setup() {
    let currentExecutors = ref([]);

    const saveExecutorSettings = () => {
      console.log(currentExecutors.value);
    };

    let possibleExecutors = {
      local: 'Local',
      spark: 'Apache Spark',
    };

    return {
      saveExecutorSettings,

      possibleExecutors,

      currentExecutors,
    };
  },
};
</script>
