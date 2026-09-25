import { createServer } from 'node:http';
import { renderBrandPage } from '../server/landing/dermafol-brand/render.js';
import { serveStatic } from '../server/lib/http.js';
import { resolve } from 'node:path';
// Isolated preview: no database, sessions, tracking or order routes.
const server = createServer((req,res) => {
 const path = new URL(req.url,'http://localhost').pathname;
 if(path === '/') {res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});res.end(renderBrandPage());return;}
 if(serveStatic(res,resolve('public'),path.slice(1))) return;
 res.writeHead(404);res.end('Not found');
});
server.listen(4332,'127.0.0.1',()=>console.log('Private local preview: http://127.0.0.1:4332'));
