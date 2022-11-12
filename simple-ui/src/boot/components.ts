import { boot } from 'quasar/wrappers';

export function getFormComponents() {
  const components = import.meta.globEager(
    '/src/components/nodeConfigComponents/*.vue'
  );

  return Object.entries(components).map(([name, component]) => {
    return {
      name: name.substring(name.lastIndexOf('/') + 1, name.lastIndexOf('.')),
      component: component.default,
    };
  });
}

export default boot(({ app }) => {
  getFormComponents().forEach((c) => {
    app.component(c.name, c.component);
  });
});
