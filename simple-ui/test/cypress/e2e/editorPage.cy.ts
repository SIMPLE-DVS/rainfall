describe('Editor Page tests', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/v1/nodes', {
      fixture: '../fixtures/nodes.json',
    });
    cy.visit('/');
  });

  it('goes to the editor page when dropping the CustomNode', () => {
    cy.dropNode('Base', 'CustomNode');
    cy.testRoute('/editor');
  });

  it('has 0 custom nodes at the beginning', () => {
    cy.get('.q-tab[href="#/editor"]').click();
    cy.dataCy('leftDrawer').click();
    cy.dataCy('customNode').should('have.length', 0);
  });

  it('creates and deletes custom nodes', () => {
    cy.intercept('POST', '**/api/v1/nodes/custom', {
      fixture: '../fixtures/custom.json',
    });
    cy.createOrEditCustomNode(
      'def custom_function(i, o, p):\no["o1"] = i["i1"] + i["i2"]',
      'CustomNodeName'
    );
    cy.dropNode('Base', 'CustomNodeName');
    cy.get('.q-tab[href="#/editor"]').click();
    cy.dataCy('leftDrawer').click();
    cy.dataCy('customNode').should('have.length', 1);
    cy.dataCy('deleteCustomNode').click();
    cy.dataCy('customNode').should('have.length', 0);
  });

  it('goes to the editor when editing a dropped custom nodes', () => {
    cy.intercept('POST', '**/api/v1/nodes/custom', {
      fixture: '../fixtures/custom.json',
    });
    cy.createOrEditCustomNode(
      'def custom_function(i, o, p):\no["o1"] = i["i1"] + i["i2"]',
      'CustomNodeName',
      false
    );
    cy.get('.q-tab[href="#/canvas"]').click();
    cy.dropNode('Base', 'CustomNodeName');
    cy.dataCy('rightDrawer').click();
    cy.dataCy('editCustomNode').should('exist').click();
    cy.testRoute('/editor');
  });

  it('creates and changes custom nodes', () => {
    const replies = [
      {
        fixture: '../fixtures/custom.json',
      },
      {
        fixture: '../fixtures/custom2.json',
      },
    ];
    let count = 0;
    cy.intercept('POST', '**/api/v1/nodes/custom', (req) => {
      req.reply(replies[count++]);
    });

    cy.createOrEditCustomNode(
      'def custom_function(i, o, p):\no["o1"] = i["i1"] + i["i2"]',
      'CustomNodeName',
      false
    );
    cy.dropNode('Base', 'CustomNodeName');
    cy.createOrEditCustomNode(
      'def custom_function(i, o, p):\no["o4"] = i["i3"]\no["o2"] = i["i0"]',
      'CustomNodeName',
      true
    );
    cy.dataCy('customNode').should('have.length', 1);
  });

  it('clears editor text', () => {
    cy.get('.q-tab[href="#/editor"]').click();
    const text = 'def custom_function(i, o):';
    cy.dataCy('editor').type(text);
    cy.dataCy('editor').should('contain.text', text);
    cy.dataCy('newCustomNode').click();
    cy.dataCy('editor').should('not.contain.text', text);
  });
});

export {};
