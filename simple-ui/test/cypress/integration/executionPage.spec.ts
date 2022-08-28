import { Server as MockServer, WebSocket as MockWebSocket } from 'mock-socket';

describe('Execution Page tests', () => {
  let mockServer: MockServer;

  beforeEach(() => {
    cy.intercept('GET', '**/api/v1/nodes', []);
    cy.intercept('GET', '**/api/v1/repositories', ['abc']);
    cy.intercept('GET', '**/api/v1/repositories/archived', []);
    let wsResponse: string;
    cy.fixture('../fixtures/log.txt').then((log) => {
      wsResponse = log;
    });
    cy.visit('#/execution', {
      onBeforeLoad(win) {
        mockServer = new MockServer('ws://localhost:5000/ws/execution');
        mockServer.on('connection', (socket) => {
          socket.on('message', () => {
            wsResponse.split('\n').forEach((l) => {
              socket.send(l);
            });
          });
        });
        win.WebSocket = MockWebSocket;
      },
    });
  });

  afterEach(() => {
    mockServer.stop();
  });

  it('has no nodes and edges at the beginning', () => {
    cy.get('.node').should('have.length', 0);
    cy.get('.edge').should('have.length', 0);
    cy.get('.mark').should('have.length', 0);
    cy.get('.error').should('have.length', 0);
  });

  it('shows the same nodes and edges of the ui page', () => {
    cy.visit('/');
    cy.dataCy('loadFromJSON').selectFile('test/cypress/fixtures/ui.json', {
      force: true,
    });
    const executionTab = cy.get('.q-tab[href="#/execution"]');
    executionTab.click().then(() => {
      cy.get('.node').should('have.length.greaterThan', 0);
      cy.get('.edge').should('have.length.greaterThan', 0);
      cy.get('.mark').should('have.length', 0);
      cy.get('.error').should('have.length', 0);
    });
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

  it("doesn't start execution if no repo is selected", () => {
    cy.dataCy('log').then((log) => {
      expect(log.val()).to.be.empty;
    });
    cy.dataCy('executionButton')
      .click()
      .then(() => {
        cy.withinDialog({
          fn: ($dialog) => {
            cy.wrap($dialog).get('input').type('path');
            cy.wrap($dialog).get('.q-btn').contains('OK').click();
          },
        });
        cy.dataCy('log').then((log) => {
          cy.get('.q-notification').should('exist');
          expect(log.val()).to.be.empty;
        });
      });
  });

  it('executes and logs', () => {
    cy.get('.q-tab[href="#/canvas"]').click();
    cy.dataCy('loadFromJSON').selectFile('test/cypress/fixtures/ui.json', {
      force: true,
    });
    cy.get('.q-tab[href="#/import_export"]').click();
    cy.get('.q-tab[href="#/execution"]').click();
    cy.dataCy('log').then((log) => {
      expect(log.val()).to.be.empty;
    });
    cy.dataCy('executionButton')
      .click()
      .then(() => {
        cy.withinDialog({
          fn: ($dialog) => {
            cy.wrap($dialog).get('input').type('path');
            cy.wrap($dialog).get('.q-btn').contains('OK').click();
          },
        });
        cy.dataCy('log').then((log) => {
          expect(log.val()).not.to.be.empty;
          cy.get('.mark').should('have.length.greaterThan', 0);
        });
      });
  });
});

export {};
