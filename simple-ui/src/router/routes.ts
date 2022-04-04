import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/CanvasLayout.vue'),
    children: [
      {
        path: '',
        redirect: '/canvas',
      },
      {
        path: 'd3',
        name: 'd3',
        component: () => import('pages/D3Page.vue'),
      },
      {
        path: 'canvas',
        name: 'canvas',
        component: () => import('pages/Fabric.vue'),
      },
      {
        path: 'import_export',
        name: 'import_export',
        component: () => import('pages/ImportExportSettings.vue'),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
