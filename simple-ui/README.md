# RAINFALL Frontend

Frontend for RAINFALL

## Features

RAINFALL frontend is composed of four main pages:

- Canvas: is the main focus of the application and also acts as the homepage. This page permits the creation of DataFlows;
- Custom Node Editor: this page gives the possibility to define custom nodes by writing Python code in an integrated editor;
- Execution & Monitoring: when the DataFlow has been successfully defined and the parameters of the nodes have been correctly set, this page allows to launch the DataFlow and monitor its progress and the logs produced;
- Repository & DataFlow Management: the page permits to manage previously created DataFlows, as well as their associated metadata. These DataFlows are grouped into repositories for an easier access and better organization.

## Install the dependencies

```bash
yarn
# or
npm install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)

```bash
yarn dev
# or
npm run dev
# or
quasar dev
```

### Lint the files

```bash
yarn lint
# or
npm run lint
```

### Format the files

```bash
yarn format
# or
npm run format
```

### Build the app for production

```bash
yarn build
# or
npm run build
# or
quasar build
```

### Customize the configuration

See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).
