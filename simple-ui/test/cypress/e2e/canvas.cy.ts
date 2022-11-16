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
    cy.get('.q-tab[href="#/editor"]').click();
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

  it('shows error when trying to rename more than one node', () => {
    cy.dropNode('Pandas', 'PandasPivot', 300, 300);
    cy.dropNode('Pandas', 'PandasPivot', 600, 300);
    cy.get('.node[data-id=PandasPivot1]').click({ ctrlKey: true });
    cy.get('.edit').click();
    cy.get('.q-notification')
      .should('exist')
      .should('have.class', 'bg-negative');
  });

  it('clears selection when clicking outside a node', () => {
    cy.dropNode('Pandas', 'PandasPivot', 400, 100);
    cy.get('g.selection').should('be.visible');
    cy.dataCy('canvas')
      .click(400, 400)
      .then(() => {
        cy.get('g.selection').should('not.be.visible');
      });
  });

  it('supports rectangular selection', () => {
    cy.get('rect.right-sel-rect').should('not.exist');
    cy.dataCy('canvasGraphics')
      .trigger('mousedown', {
        eventConstructor: 'MouseEvent',
        button: 2,
        x: 100,
        y: 100,
        force: true,
      })
      .trigger('mousemove', {
        eventConstructor: 'MouseEvent',
        button: 2,
        x: 500,
        y: 500,
        force: true,
      });
    cy.get('rect.right-sel-rect').should('exist').and('be.visible');
    cy.dataCy('canvasGraphics').trigger('mouseup', {
      eventConstructor: 'MouseEvent',
      button: 2,
      x: 300,
      y: 300,
      force: true,
    });
    cy.get('rect.right-sel-rect').should('not.exist');
  });

  it('selects nodes with rectangular selection', () => {
    cy.dropNode('Pandas', 'PandasPivot', 400, 200);
    cy.dropNode('Pandas', 'PandasPivot', 400, 400);
    cy.dataCy('canvas').click(600, 300);
    cy.dataCy('canvasGraphics')
      .trigger('mousedown', {
        eventConstructor: 'MouseEvent',
        button: 2,
        clientX: 400,
        clientY: 150,
        force: true,
      })
      .trigger('mousemove', {
        eventConstructor: 'MouseEvent',
        button: 2,
        clientX: 400,
        clientY: 600,
        force: true,
      })
      .trigger('mouseup', {
        eventConstructor: 'MouseEvent',
        button: 2,
        clientX: 400,
        clientY: 600,
        force: true,
      });
    cy.get('g.selection').should('be.visible');
  });

  it('moves nodes', () => {
    cy.dropNode('Pandas', 'PandasPivot', 500, 200);
    cy.dropNode('Pandas', 'PandasPivot', 500, 400);
    cy.get('.node[data-id=PandasPivot1]')
      .click({ ctrlKey: true })
      .then((n1) => {
        cy.get('.node[data-id=PandasPivot2]').then((n2) => {
          const n1Trasnform = n1.attr('transform');
          const n2Trasnform = n2.attr('transform');

          cy.window().then((win) => {
            cy.get('rect.sel-rect')
              .first()
              .trigger('mouseover', { view: win })
              .trigger('mousedown', { clientX: 500, clientY: 300, view: win })
              .trigger('mousemove', { clientX: 600, clientY: 400, view: win })
              .trigger('mouseup', { view: win })
              .then(() => {
                cy.get('.node[data-id=PandasPivot1]').then((newN1) => {
                  expect(newN1.attr('transform')).not.to.equal(n1Trasnform);
                });
                cy.get('.node[data-id=PandasPivot2]').then((newN2) => {
                  expect(newN2.attr('transform')).not.to.equal(n2Trasnform);
                });
              });
          });
        });
      });
  });

  it('expands root node', () => {
    cy.dataCy('leftDrawer')
      .click()
      .then(() => {
        cy.dataCy('treeNode').should('not.be.visible');
        cy.dataCy('treeRoot').first().click();
        cy.dataCy('treeNode').should('be.visible');
      });
  });

  it("changes nodes' view mode", () => {
    cy.dataCy('leftDrawer')
      .click()
      .then(() => {
        cy.dataCy('treeRoot').then((roots) => {
          const nodes = roots
            .map((_, r) => r.querySelector('.q-icon').nextSibling.textContent)
            .get();
          cy.dataCy('viewToggle').find('.q-btn').contains('Type').click();
          cy.dataCy('treeRoot').then((newRoots) => {
            const newNodes = newRoots
              .map((_, r) => r.querySelector('.q-icon').nextSibling.textContent)
              .get();
            expect(newNodes.join()).to.not.equal(nodes.join());
          });
        });
      });
  });

  it('searches nodes', () => {
    cy.dataCy('leftDrawer').click();
    cy.dataCy('searchBar')
      .type('Pandas')
      .then((searchBar) => {
        cy.dataCy('treeNode').should('be.visible').and('have.length.gt', 0);
        cy.wrap(searchBar).clear();
        cy.dataCy('treeNode').should('not.be.visible');
      });
  });

  it('searches non existing nodes', () => {
    cy.dataCy('leftDrawer').click();
    cy.dataCy('searchBar')
      .type('NonExistingNodes')
      .then(() => {
        cy.get('div')
          .contains('No matching nodes found')
          .should('exist')
          .and('be.visible');
        cy.dataCy('treeNode').should('have.length', 0);
        cy.get('button').contains('cancel').click();
        cy.get('div').contains('No matching nodes found').should('not.exist');
      });
  });
});

export {};
