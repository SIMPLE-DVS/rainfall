import { D3_CONSTS } from 'src/components/d3/types';

describe('D3 Canvas tests', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/v1/nodes', {
      fixture: '../fixtures/nodes.json',
    });
    cy.intercept('POST', '**/api/v1/script', {
      fixture: '../fixtures/reversed.json',
    });
    cy.intercept('POST', '**/api/v1/config/convert', {
      fixture: '../fixtures/script.py',
    });
    cy.visit('/');
  });

  it('has no nodes and edges at the beginning', () => {
    cy.get('.node').should('have.length', 0);
    cy.get('.edge').should('have.length', 0);
  });

  it('loads data from Python script', () => {
    cy.dataCy('loadFromScript').selectFile('test/cypress/fixtures/script.py', {
      force: true,
    });
    cy.get('.node').should('have.length', 7);
    cy.get('.edge').should('have.length', 8);
  });

  it('loads data from JSON', () => {
    cy.dataCy('loadFromJSON').selectFile('test/cypress/fixtures/ui.json', {
      force: true,
    });
    cy.get('.node').should('have.length', 7);
    cy.get('.edge').should('have.length', 8);
  });

  it('loads and delete custom nodes', () => {
    cy.dataCy('loadFromJSON').selectFile('test/cypress/fixtures/ui.json', {
      force: true,
    });
    cy.visit('#/editor');
    cy.dataCy('leftDrawer')
      .click()
      .then(() => {
        cy.get('.q-item__section')
          .contains('DatasetLength')
          .next()
          .click({ force: true })
          .then(() => {
            cy.dataCy('deleteCustomNode').should('have.length', 3);
          });
      });
  });

  it('shows the right drawer if only a node is selected', () => {
    cy.dataCy('loadFromJSON').selectFile('test/cypress/fixtures/ui.json', {
      force: true,
    });
    cy.dataCy('rightDrawer').should('not.exist');
    const customNode = cy.get('g[data-id=DatasetCreator1]');
    customNode.should('exist');
    customNode.click();
    cy.dataCy('rightDrawer').should('exist');
  });

  it('downloads UI state as JSON', () => {
    cy.dataCy('loadFromJSON').selectFile('test/cypress/fixtures/ui.json', {
      force: true,
    });
    cy.dataCy('saveUI').click();
    cy.readFile('test/cypress/downloads/ui.json').should('exist');
  });

  it('downloads UI state as Python script', () => {
    cy.dataCy('loadFromJSON').selectFile('test/cypress/fixtures/ui.json', {
      force: true,
    });
    cy.dataCy('saveScript').click();
    cy.readFile('test/cypress/downloads/script.py').should('exist');
  });

  it('pans the canvas', () => {
    cy.dataCy('canvasGraphics').then((d3g) => {
      const originalTransform = d3g.attr('transform');
      cy.wrap(d3g)
        .trigger('mousedown', {
          eventConstructor: 'MouseEvent',
          button: 1,
          x: 100,
          y: 100,
          force: true,
        })
        .trigger('mousemove', {
          eventConstructor: 'MouseEvent',
          x: 200,
          y: 200,
          force: true,
        })
        .trigger('mouseup', {
          eventConstructor: 'MouseEvent',
          x: 200,
          y: 200,
          force: true,
        });
      cy.dataCy('canvasGraphics')
        .should('have.attr', 'transform')
        .should('not.equal', originalTransform);
    });
  });

  it('zooms the canvas', () => {
    cy.dataCy('canvasGraphics').then((d3g) => {
      const originalTransform = d3g.attr('transform');
      cy.dropNode('Pandas', 'PandasPivot', 500, 400);
      cy.dataCy('canvasGraphics').trigger('wheel', {
        eventConstructor: 'WheelEvent',
        deltaY: -120,
        wheelDeltaY: -120,
        force: true,
      });
      cy.dataCy('canvasGraphics')
        .should('have.attr', 'transform')
        .should('not.equal', originalTransform);
    });
  });

  it('creates two nodes, connects and disconnects them', () => {
    cy.dropNode('Pandas', 'PandasPivot', 300, 300);
    cy.get('.node').should('have.length', 1);
    cy.dropNode('Pandas', 'PandasPivot', 600, 300);
    cy.get('.node').should('have.length', 2);

    cy.get('circle.connected').should('have.length', 0);
    cy.get('circle.compatible').should('have.length', 0);
    cy.get('.edge').should('have.length', 0);

    cy.window().then((win) => {
      const outputPort = cy.get(
        'circle[data-parent="PandasPivot1"][data-io="output"]'
      );
      outputPort.should('exist').should('have.length', 1);
      outputPort.then((output) => {
        cy.wrap(output).trigger('mousedown', {
          force: true,
          view: win,
        });
        cy.get('circle.compatible').should('have.length', 2);
        const inputPort = cy.get(
          'circle[data-parent="PandasPivot2"][data-io="input"]'
        );
        inputPort.should('exist').should('have.length', 1);
        let inputPosition: JQuery.Coordinates;
        inputPort.then((input) => {
          inputPosition = input.position();
          cy.wrap(output).trigger('mouseup', {
            clientX: inputPosition.left + D3_CONSTS.PORT_RADIUS,
            clientY: inputPosition.top + D3_CONSTS.PORT_RADIUS,
            force: true,
            view: win,
          });
        });
        cy.get('circle.compatible').should('have.length', 0);
        cy.get('circle.connected').should('have.length', 2);
        cy.get('.edge').should('have.length', 1);

        cy.wrap(output)
          .dblclick()
          .then(() => {
            cy.get('circle.compatible').should('have.length', 0);
            cy.get('circle.connected').should('have.length', 0);
            cy.get('.edge').should('have.length', 0);
          });
      });
    });
  });

  it('copies and deletes nodes', () => {
    cy.get('.node').should('have.length', 0);
    cy.dropNode('Pandas', 'PandasPivot', 300, 300);
    cy.get('.node').should('have.length', 1);
    cy.get('.node').click();
    cy.get('.copy').should('exist').click({ force: true });
    cy.withinDialog({
      fn: ($dialog) => {
        cy.wrap($dialog).get('.q-btn').contains('OK').click();
      },
    });
    cy.get('.node').should('have.length', 2);
    cy.get('.node[data-id="PandasPivot1"]').click({ ctrlKey: true });
    cy.get('.delete').should('exist').click({ force: true });
    cy.withinDialog({
      fn: ($dialog) => {
        cy.wrap($dialog).get('.q-btn').contains('OK').click();
      },
    });
    cy.get('.node').should('have.length', 0);
  });

  it('renames nodes', () => {
    cy.dropNode('Pandas', 'PandasPivot', 300, 300);
    cy.get('.node').click();
    cy.get('.edit').should('exist').click({ force: true });
    cy.get('.node').should('have.data', 'id', 'PandasPivot1');
    cy.withinDialog({
      fn: ($dialog) => {
        cy.wrap($dialog).get('.q-input').clear().type('PandasPivotTest');
        cy.wrap($dialog).get('.q-btn').contains('OK').click();
      },
    });
    cy.get('.node').should('have.data', 'id', 'PandasPivotTest');
  });
});

export {};
