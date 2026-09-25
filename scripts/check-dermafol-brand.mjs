import assert from 'node:assert/strict';
import { existsSync, statSync, readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import { GIFTS, BONUS, PLANS } from '../server/landing/dermafol-brand/data.js';
import { renderBrandPage } from '../server/landing/dermafol-brand/render.js';
const html = renderBrandPage();
for(const p of PLANS){
 const unlocked = GIFTS.filter(g => g.level <= p.qty);
 assert.equal(unlocked.length,p.gifts);
 assert.equal(unlocked.reduce((n,g)=>n+g.value,0),p.giftValue);
 assert.equal(p.price/p.qty,p.unit);
 for(const prepaid of [false,true]){
  assert.equal(p.giftValue+(prepaid?BONUS.value:0),({1:[15000,54900],2:[57800,97700],3:[117600,157500]})[p.qty][Number(prepaid)]);
 }
}
assert.match(html,/name="plan" value="3" checked/);
assert.match(html,/name="payment" value="cod" checked/);
assert.match(html,/noindex,nofollow/);
assert.doesNotMatch(html,/<form[^>]*data-ds-form/); // Avoid legacy runtime's real-order handler.
const client=readFileSync(new URL('../server/landing/dermafol-brand/client.js',import.meta.url),'utf8');
assert.doesNotMatch(client,/fetch\(['"]\/api\//);
assert.doesNotMatch(html,/\$(?:3\.500|2\.300|6\.000|5\.800|12\.800)/);
for(const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) new Script(m[1]);
const assetPaths=[...new Set([...html.matchAll(/(?:src|href)="(\/assets\/[^"?]+)"/g)].map(m=>m[1]))];
for(const p of assetPaths) assert.ok(existsSync('public'+p),'Missing '+p);
assert.ok(statSync('public/assets/dermafol-brand/kit-caja-480.webp').size < 70000);
console.log('PASS: six offer/payment combinations, gift totals, default selection, private preview, no real order submission, assets and JavaScript syntax.');
console.log('HTML bytes:',Buffer.byteLength(html),'referenced assets:',assetPaths.length);
