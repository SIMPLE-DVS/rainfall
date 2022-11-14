describe('Import/Export Page tests', () => {
  it('has 0 active and archived repositories at the beninning', () => {
    cy.intercept('GET', '**/api/v1/repositories', []);
    cy.intercept('GET', '**/api/v1/repositories/archived', []);
    cy.visit('#/import_export');
    cy.dataCy('repository').should('have.length', 0);
    cy.dataCy('archivedRepository').should('have.length', 0);
  });

  it('has different active and archived repositories', () => {
    cy.intercept('GET', '**/api/v1/repositories', ['abc', 'def', 'ghi']);
    cy.intercept('GET', '**/api/v1/repositories/archived', ['arc']);
    cy.visit('#/import_export');
    cy.dataCy('repository').should('have.length', 3);
    cy.dataCy('archivedRepository').should('have.length', 1);
  });

  it('can add new repos', () => {
    cy.intercept('GET', '**/api/v1/repositories', []);
    cy.intercept('GET', '**/api/v1/repositories/archived', []);
    cy.intercept('POST', '**/api/v1/repositories/new', { statusCode: 200 });
    cy.visit('#/import_export');
    cy.dataCy('addRepo').click();
    cy.withinDialog(($dialog) => {
      cy.wrap($dialog).get('.q-input').type('new');
      cy.wrap($dialog).get('.q-btn').contains('OK').click();
    });
    cy.dataCy('repository').should('have.length', 1);
    cy.dataCy('archivedRepository').should('have.length', 0);
  });

  it('can archive repos', () => {
    cy.intercept('GET', '**/api/v1/repositories', ['abc']);
    cy.intercept('GET', '**/api/v1/repositories/archived', []);
    cy.intercept('DELETE', '**/api/v1/repositories/abc?shallow=true', {
      statusCode: 204,
    });
    cy.visit('#/import_export');
    cy.dataCy('repository').dataCy('archiveRepo').click();
    cy.withinDialog(($dialog) => {
      cy.wrap($dialog).get('.q-btn').contains('OK').click();
    });
    cy.dataCy('repository').should('have.length', 0);
    cy.dataCy('archivedRepository').should('have.length', 1);
  });

  it('can unarchive repos', () => {
    cy.intercept('GET', '**/api/v1/repositories', []);
    cy.intercept('GET', '**/api/v1/repositories/archived', ['abc']);
    cy.intercept('POST', '**/api/v1/repositories/archived/abc', {
      statusCode: 200,
    });
    cy.visit('#/import_export');
    cy.dataCy('archivedRepository').dataCy('unarchiveRepo').click();
    cy.withinDialog(($dialog) => {
      cy.wrap($dialog).get('.q-btn').contains('OK').click();
    });
    cy.dataCy('repository').should('have.length', 1);
    cy.dataCy('archivedRepository').should('have.length', 0);
  });

  it('can delete repos', () => {
    cy.intercept('GET', '**/api/v1/repositories', ['abc']);
    cy.intercept('GET', '**/api/v1/repositories/archived', []);
    cy.intercept('DELETE', '**/api/v1/repositories/abc?shallow=false', {
      statusCode: 204,
    });
    cy.visit('#/import_export');
    cy.dataCy('repository').dataCy('deleteRepo').click();
    cy.withinDialog(($dialog) => {
      cy.wrap($dialog).get('.q-btn').contains('OK').click();
    });
    cy.dataCy('repository').should('have.length', 0);
    cy.dataCy('archivedRepository').should('have.length', 0);
  });

  it('can delete archived repos', () => {
    cy.intercept('GET', '**/api/v1/repositories', []);
    cy.intercept('GET', '**/api/v1/repositories/archived', ['abc']);
    cy.intercept('DELETE', '**/api/v1/repositories/archived/abc', {
      statusCode: 204,
    });
    cy.visit('#/import_export');
    cy.dataCy('archivedRepository').dataCy('deleteArchivedRepo').click();
    cy.withinDialog(($dialog) => {
      cy.wrap($dialog).get('.q-btn').contains('OK').click();
    });
    cy.dataCy('repository').should('have.length', 0);
    cy.dataCy('archivedRepository').should('have.length', 0);
  });

  it('can mark as default', () => {
    cy.intercept('GET', '**/api/v1/repositories', ['abc', 'def']);
    cy.intercept('GET', '**/api/v1/repositories/archived', []);
    cy.visit('#/import_export');
    cy.dataCy('repository')
      .contains('Use by default')
      .should('exist')
      .parent()
      .siblings()
      .contains('abc')
      .should('exist');
    cy.dataCy('markAsDefault').first().click();
    cy.withinDialog(($dialog) => {
      cy.wrap($dialog).get('.q-btn').contains('OK').click();
    });
    cy.dataCy('repository')
      .contains('Use by default')
      .should('exist')
      .parent()
      .siblings()
      .contains('def')
      .should('exist');
  });

  it("doesn't open repository dialog if there is an error", () => {
    cy.intercept('GET', '**/api/v1/repositories', ['abc']);
    cy.intercept('GET', '**/api/v1/repositories/archived', []);
    cy.intercept('GET', '**/api/v1/repositories/abc', { statusCode: 404 });
    cy.visit('#/import_export');
    cy.dataCy('openRepositoryDialog').should('exist').click();
    cy.get('.q-notification')
      .should('exist')
      .should('have.class', 'bg-negative');
  });

  it("doesn't open repository dialog if there are no dataflows", () => {
    cy.intercept('GET', '**/api/v1/repositories', ['abc']);
    cy.intercept('GET', '**/api/v1/repositories/archived', []);
    cy.intercept('GET', '**/api/v1/repositories/abc', {
      statusCode: 200,
      body: {
        content: [],
      },
    });
    cy.visit('#/import_export');
    cy.dataCy('openRepositoryDialog').should('exist').click();
    cy.get('.q-notification')
      .should('exist')
      .should('have.class', 'bg-negative')
      .should('contain.text', 'No dataflows available');
  });

  it('opens the repository dialog if there are dataflows', () => {
    cy.intercept('GET', '**/api/v1/repositories', ['abc']);
    cy.intercept('GET', '**/api/v1/repositories/archived', []);
    cy.intercept('GET', '**/api/v1/repositories/abc', {
      statusCode: 200,
      body: {
        content: [
          ['d1', 0],
          ['d2', 10000],
          ['d3', 100000],
        ],
      },
    });
    cy.visit('#/import_export');
    cy.dataCy('openRepositoryDialog').should('exist').click();
    cy.get('.q-dialog').should('exist');
  });

  it('sorts dataflows by last modified time', () => {
    cy.intercept('GET', '**/api/v1/repositories', ['abc']);
    cy.intercept('GET', '**/api/v1/repositories/archived', []);
    cy.intercept('GET', '**/api/v1/repositories/abc', {
      statusCode: 200,
      body: {
        content: [
          ['d1', 0],
          ['d2', 10000],
          ['d3', 100000],
        ],
      },
    });
    cy.visit('#/import_export');
    cy.dataCy('openRepositoryDialog').should('exist').click();
    cy.dataCy('dataflow').should('have.length', 3);
    cy.dataCy('dataflow').then((dataflows) => {
      dataflows.each((i, el) => {
        cy.wrap(el)
          .find('.q-item__label')
          .first()
          .then((label) => {
            expect(label.text()).to.equal(`d${3 - i}`);
          });
      });
    });
  });

  it('loads the UI from the repository dialog', () => {
    cy.intercept('GET', '**/api/v1/repositories', ['abc']);
    cy.intercept('GET', '**/api/v1/repositories/archived', []);
    cy.intercept('GET', '**/api/v1/repositories/abc', {
      statusCode: 200,
      body: {
        content: [['dataflow', 0]],
      },
    });
    cy.fixture('../fixtures/ui.json').then((uiJSON) => {
      cy.intercept('GET', '**/api/v1/repositories/abc/dataflows/dataflow', {
        statusCode: 200,
        body: {
          id: 'id',
          path: 'path',
          script: 'script',
          metadata: 'metadata',
          requirements: 'rain',
          ui: JSON.stringify(uiJSON),
        },
      });
    });
    cy.visit('#/import_export');
    cy.dataCy('openRepositoryDialog').click();
    cy.dataCy('dataflow').click();
    cy.dataCy('loadUI').click();
    cy.get('.node').should('have.length.greaterThan', 0);
    cy.get('.edge').should('have.length.greaterThan', 0);
  });

  it('downloads the UI from the repository dialog', () => {
    cy.intercept('GET', '**/api/v1/repositories', ['abc']);
    cy.intercept('GET', '**/api/v1/repositories/archived', []);
    cy.intercept('GET', '**/api/v1/repositories/abc', {
      statusCode: 200,
      body: {
        content: [['dataflow', 0]],
      },
    });
    cy.fixture('../fixtures/ui.json').then((uiJSON) => {
      cy.intercept('GET', '**/api/v1/repositories/abc/dataflows/dataflow', {
        statusCode: 200,
        body: {
          id: 'id',
          path: 'path',
          script: 'script',
          metadata: 'metadata',
          requirements: 'rain',
          ui: JSON.stringify(uiJSON),
        },
      });
    });
    cy.visit('#/import_export');
    cy.dataCy('openRepositoryDialog').click();
    cy.dataCy('dataflow').click();
    cy.dataCy('downloadUI').click();
    cy.readFile('test/cypress/downloads/ui.json').should('exist');
  });

  it('downloads the Python script from the repository dialog', () => {
    cy.intercept('GET', '**/api/v1/repositories', ['abc']);
    cy.intercept('GET', '**/api/v1/repositories/archived', []);
    cy.intercept('GET', '**/api/v1/repositories/abc', {
      statusCode: 200,
      body: {
        content: [['dataflow', 0]],
      },
    });
    cy.fixture('../fixtures/ui.json').then((uiJSON) => {
      cy.intercept('GET', '**/api/v1/repositories/abc/dataflows/dataflow', {
        statusCode: 200,
        body: {
          id: 'id',
          path: 'path',
          script: 'script',
          metadata: 'metadata',
          requirements: 'rain',
          ui: JSON.stringify(uiJSON),
        },
      });
    });
    cy.visit('#/import_export');
    cy.dataCy('openRepositoryDialog').click();
    cy.dataCy('dataflow').click();
    cy.dataCy('downloadScript').click();
    cy.readFile('test/cypress/downloads/script.py').should('exist');
  });

  it('deletes the dataflow from the repository dialog', () => {
    cy.intercept('GET', '**/api/v1/repositories', ['abc']);
    cy.intercept('GET', '**/api/v1/repositories/archived', []);
    cy.intercept('GET', '**/api/v1/repositories/abc', {
      statusCode: 200,
      body: {
        content: [
          ['dataflow1', 0],
          ['dataflow2', 100000],
        ],
      },
    });
    cy.intercept('GET', '**/api/v1/repositories/abc/dataflows/dataflow**', {
      statusCode: 200,
      body: {
        id: 'id',
        path: 'path',
        script: 'script',
        metadata: 'metadata',
        requirements: 'rain',
        ui: 'ui',
      },
    });
    cy.intercept('DELETE', '**/api/v1/repositories/abc/dataflows/dataflow**', {
      statusCode: 204,
    });
    cy.visit('#/import_export');
    cy.dataCy('openRepositoryDialog').click();
    cy.dataCy('dataflow').first().click();
    cy.dataCy('dataflow').should('have.length', 2);
    cy.dataCy('deleteDataflow').first().click();
    cy.dataCy('dataflow').should('have.length', 1);
    cy.get('.q-dialog').should('be.visible');
    cy.dataCy('dataflow').first().click();
    cy.dataCy('deleteDataflow').first().click();
    cy.dataCy('dataflow').should('have.length', 0);
    cy.get('.q-dialog').should('not.be.visible');
  });
});

export {};
