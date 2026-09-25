import assert from 'node:assert/strict';
// Isolated in-memory database; never touches the production connection.
process.env.DEMO_MODE = '1';
const { PGlite } = await import('@electric-sql/pglite');
const db = new PGlite();
globalThis.__dsDemo = Promise.resolve(db);
await db.exec(`CREATE TABLE pages(slug TEXT,status TEXT); INSERT INTO pages VALUES('private-draft','draft');`);
const { renderPublicPage,forgetPages } = await import('../server/api/pages.js');
forgetPages();
assert.equal(await renderPublicPage('private-draft'),null,'Draft leaked on cold cache');
assert.equal(await renderPublicPage('private-draft'),null,'Draft leaked on warm cache');
assert.equal(await renderPublicPage('missing-page'),null);
await db.close();
console.log('PASS: drafts inaccessible with cold and warm caches; missing pages inaccessible.');
