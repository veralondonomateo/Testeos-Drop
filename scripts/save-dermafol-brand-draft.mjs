import assert from 'node:assert/strict';
import { getPool, closePool } from '../server/db.js';
import { renderBrandPage } from '../server/landing/dermafol-brand/render.js';
import { PAGE_ID, SLUG, TITLE } from '../server/landing/dermafol-brand/data.js';
const client = await getPool().connect();
try {
 await client.query('BEGIN');
 const before = (await client.query('SELECT id, md5(row_to_json(pages)::text) AS hash FROM pages WHERE id <> $1 ORDER BY id',[PAGE_ID])).rows;
 const prior = (await client.query('SELECT slug,status FROM pages WHERE id=$1 FOR UPDATE',[PAGE_ID])).rows[0];
 if(prior){ assert.equal(prior.slug,SLUG); assert.equal(prior.status,'draft','Refusing to overwrite a published page'); }
 const now = new Date().toISOString();
 await client.query(`INSERT INTO pages(id,slug,title,product_id,test_id,variant,type,status,html,notes,created_at,updated_at,tienda_id)
 VALUES($1,$2,$3,'prd_dermafol360',NULL,'D','landing','draft',$4,$5,$6,$6,'tnd_dermafol')
 ON CONFLICT(id) DO UPDATE SET html=EXCLUDED.html,title=EXCLUDED.title,notes=EXCLUDED.notes,updated_at=EXCLUDED.updated_at
 WHERE pages.status='draft' AND pages.slug=EXCLUDED.slug`,[PAGE_ID,SLUG,TITLE,renderBrandPage(),'Vista previa privada Brand Ritual. Carrito y formulario de demostración; no genera pedidos ni cobra. Contraentrega y anticipado visibles; integración Mercado Pago/Wompi pendiente. Mantener como borrador.',now]);
 const after = (await client.query('SELECT id, md5(row_to_json(pages)::text) AS hash FROM pages WHERE id <> $1 ORDER BY id',[PAGE_ID])).rows;
 assert.deepEqual(after,before,'An existing page changed; rolling back');
 await client.query('COMMIT');
 console.log(JSON.stringify({id:PAGE_ID,slug:SLUG,status:'draft',existingPagesUnchanged:before.length}));
} catch(e){ await client.query('ROLLBACK'); throw e; }
finally { client.release(); await closePool(); }
