/**
 * Punto de entrada de Vercel.
 *
 * Vercel ejecuta este archivo como Serverless Function y le pasa (req, res)
 * de Node. El handler de `server/index.js` ya tiene exactamente esa firma,
 * así que aquí sólo se reexporta.
 *
 * El enrutado lo define `vercel.json`: todo `/api/*` y `/p/*` llega aquí;
 * lo demás lo sirve el CDN desde `public/`.
 */
export { handler as default } from '../server/index.js';
