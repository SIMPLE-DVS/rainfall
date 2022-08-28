describe('Editor Page tests', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/v1/nodes', {
      fixture: '../fixtures/nodes.json',
    });
  });

  it('goes to the editor page when dropping the CustomNode', () => {
    cy.dropNode('Base', 'CustomNode');
    cy.testRoute('/editor');
  });

  it('has 0 custom nodes at the beginning', () => {
    cy.visit('#/editor');
    cy.dataCy('leftDrawer').click();
    cy.dataCy('customNode').should('have.length', 0);
  });

  it('creates and deletes custom nodes', () => {
    cy.intercept('POST', '**/api/v1/nodes/custom', {
      fixture: '../fixtures/custom.json',
    });
    cy.visit('#/editor');
    cy.dataCy('editor').type(
      'def custom_function(i, o):\no["o1"] = i["i1"] + i["i2"]'
    );
    cy.dataCy('saveCustomNode').click();
    cy.dataCy('customNodeName').type('CustomNodeName');
    cy.dataCy('createCustomNode').click();
    cy.dataCy('leftDrawer').click();
    cy.dataCy('customNode').should('have.length', 1);
    cy.dataCy('deleteCustomNode').click();
    cy.dataCy('customNode').should('have.length', 0);
  });

  it('goes to the editor when editing a dropped custom nodes', () => {
    cy.intercept('POST', '**/api/v1/nodes/custom', {
      fixture: '../fixtures/custom.json',
    });
    cy.visit('#/editor');
    cy.dataCy('editor').type(
      'def custom_function(i, o):\no["o1"] = i["i1"] + i["i2"]'
    );
    cy.dataCy('saveCustomNode').click();
    cy.dataCy('customNodeName').type('CustomNodeName');
    cy.dataCy('createCustomNode').click();
    cy.get('.q-tab[href="#/canvas"]').click();
    cy.dropNode('Base', 'CustomNodeName');
    cy.dataCy('rightDrawer').click();
    cy.dataCy('editCustomNode').should('exist').click();
    cy.testRoute('/editor');
  });

  it('creates and changes custom nodes', () => {
    cy.intercept('POST', '**/api/v1/nodes/custom', {
      fixture: '../fixtures/custom.json',
    });
    cy.visit('#/editor');
    cy.dataCy('editor').type(
      'def custom_function(i, o, p):\no["o1"] = i["i1"] + i["i2"]'
    );
    cy.dataCy('saveCustomNode').click();
    cy.dataCy('customNodeName').type('CustomNodeName');
    cy.intercept('POST', '**/api/v1/nodes/custom', {
      fixture: '../fixtures/custom.json',
    });
    cy.dataCy('createCustomNode').click();

    cy.get('.q-tab[href="#/canvas"]')
      .click()
      .then(() => {
        cy.dropNode('Base', 'CustomNodeName');
        cy.get('.q-tab[href="#/editor"]').click();
      });

    cy.dataCy('leftDrawer').click();
    const dataTransfer = new DataTransfer();
    cy.dataCy('customNode').trigger('dragstart', { dataTransfer });
    cy.dataCy('editor').trigger('drop', {
      dataTransfer,
    });
    cy.dataCy('leftDrawer').click();
    cy.dataCy('editor')
      .type('{selectAll}{backspace}')
      .type(
        'def custom_function(i, o, p):\no["o4"] = i["i3"]\no["o2"] = i["i0"]'
      );
    cy.dataCy('saveCustomNode').click();
    cy.dataCy('customNodeName')
      .type('{selectAll}{backspace}')
      .type('CustomNodeName');
    cy.dataCy('customNode').should('have.length', 1);
    cy.intercept('POST', '**/api/v1/nodes/custom', {
      fixture: '../fixtures/custom2.json',
    });
    cy.dataCy('createCustomNode').click();
    cy.dataCy('customNode').should('have.length', 1);
  });

  it('clears editor text', () => {
    cy.visit('#/editor');
    const text = 'def custom_function(i, o):';
    cy.dataCy('editor').type(text);
    cy.dataCy('editor').should('contain.text', text);
    cy.dataCy('newCustomNode').click();
    cy.dataCy('editor').should('not.contain.text', text);
  });
});

export {};
