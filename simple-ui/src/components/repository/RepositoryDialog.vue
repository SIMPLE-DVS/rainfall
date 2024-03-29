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
  <q-dialog ref="dialogRef">
    <q-card
      class="q-pa-sm"
      style="display: flex; flex-direction: column; align-items: center"
    >
      DataFlows in repository: {{ repoName }}
      <q-scroll-area class="fit">
        <div class="q-pa-sm">
          <div v-for="n in 5" :key="n">Drawer {{ n }} / 50</div>
        </div>
      </q-scroll-area>
      <q-card-section class="column items-center">
        <q-list bordered style="min-width: 500px">
          <div v-for="[flow, modifiedTime] in copiedDataFlows" :key="flow">
            <q-expansion-item
              group="flow"
              :label="flow"
              :caption="`Last Modified: ${new Date(modifiedTime * 1000)}`"
              @before-show="loadDataflow(flow)"
              data-cy="dataflow"
            >
              <q-item-section avatar top style="align-items: center">
                <q-icon name="account_tree" color="black" size="34px" />
                Name: {{ flow }}
                <span class="q-pa-sm q-gutter-sm">
                  <q-btn
                    :disable="
                      !metadata.has(flow) || metadata.get(flow).ui == null
                    "
                    outline
                    icon="architecture"
                    label="LOAD UI"
                    @click="onLoadUI(flow)"
                    data-cy="loadUI"
                  ></q-btn>
                  <q-btn
                    :disable="
                      !metadata.has(flow) || metadata.get(flow).ui == null
                    "
                    outline
                    icon="download"
                    label="UI"
                    @click="onDownloadUI(flow)"
                    data-cy="downloadUI"
                  ></q-btn>
                  <q-btn
                    :disable="
                      !metadata.has(flow) || metadata.get(flow).script == null
                    "
                    outline
                    icon="download"
                    label="SCRIPT"
                    @click="onDownloadScript(flow)"
                    data-cy="downloadScript"
                  ></q-btn>
                  <q-btn
                    outline
                    icon="delete"
                    label="DELETE"
                    @click="onDeleteDataFlow(flow)"
                    data-cy="deleteDataflow"
                  ></q-btn>
                </span>
              </q-item-section>
              <q-item-section side>
                Metadata:
                <br />
                {{
                  metadata.has(flow)
                    ? metadata.get(flow).metadata
                    : 'No metadata available'
                }}
              </q-item-section>
            </q-expansion-item>
            <q-separator />
          </div>
        </q-list>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useDialogPluginComponent, useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { AxiosError } from 'axios';
import { downloadPythonScript, downloadUI } from '../utils';
import { setUIState } from '../d3/utils';
import { useRouter } from 'vue-router';

const props = defineProps<{
  repoName: string;
  dataflows: [string, number][];
}>();

defineEmits(useDialogPluginComponent.emitsObject);

const $q = useQuasar();
const router = useRouter();
const { dialogRef, onDialogCancel } = useDialogPluginComponent();
const metadata = ref(new Map<string, DataFlowData>());
const copiedDataFlows = ref(props.dataflows.slice());

interface DataFlowData {
  id: string;
  path: string;
  script: string;
  metadata: string;
  requirements: string;
  ui: string;
}

const loadDataflow = async (flow: string) => {
  if (metadata.value.has(flow)) {
    return;
  }
  await api
    .get<DataFlowData>(`repositories/${props.repoName}/dataflows/${flow}`)
    .then((res) => {
      metadata.value.set(flow, res.data);
    })
    .catch((err: AxiosError) => {
      $q.notify({
        message: (err.response.data as { message: string }).message,
        type: 'negative',
      });
    });
};

const onLoadUI = (flow: string) => {
  setUIState(JSON.parse(metadata.value.get(flow).ui));
  router.push({ name: 'canvas' });
};

const onDownloadUI = (flow: string) => {
  downloadUI(JSON.parse(metadata.value.get(flow).ui));
};

const onDownloadScript = (flow: string) => {
  downloadPythonScript(metadata.value.get(flow).script);
};

const onDeleteDataFlow = async (flow: string) => {
  await api
    .delete<DataFlowData>(`repositories/${props.repoName}/dataflows/${flow}`)
    .then(() => {
      copiedDataFlows.value.splice(
        copiedDataFlows.value.findIndex(([name]) => name == flow),
        1
      );
      metadata.value.delete(flow);
      if (copiedDataFlows.value.length == 0) {
        onDialogCancel();
      }
    })
    .catch((err: AxiosError) => {
      $q.notify({
        message: (err.response.data as { message: string }).message,
        type: 'negative',
      });
    });
};
</script>
