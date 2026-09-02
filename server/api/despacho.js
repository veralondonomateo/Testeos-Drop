/**
 * Puente entre un pedido de la landing y Mastershop.
 *
 * Aquí vive lo que toca la base; el diálogo con la API está en
 * `lib/mastershop.js`. La separación importa porque este archivo se puede
 * llamar desde el checkout o desde un reintento, y en los dos casos el
 * resultado tiene que quedar escrito igual.
 */

import { run, all, one } from '../db.js';
import { nowISO } from '../lib/util.js';
import { enviarPedido, puedeEnviarse } from '../lib/mastershop.js';

/** Deja constancia del intento en el propio pedido. */
async function anotar(id, estado, nota, idMastershop) {
  await run(
    `UPDATE orders SET mastershop_status = ?, mastershop_note = ?, mastershop_id = ?,
            mastershop_at = ?, updated_at = ?
     WHERE id = ?`,
    [estado, (nota || '').slice(0, 400), idMastershop ? String(idMastershop) : null,
      nowISO(), nowISO(), id]
  );
}

/**
 * Manda un pedido a Mastershop y anota el resultado.
 *
 * Nunca lanza. Quien llama suele estar dentro del checkout, y un fallo del
 * despacho no puede tumbar una venta que ya está cobrada y guardada.
 *
 * El interruptor es `MASTERSHOP_AUTO`: sin él, el pedido queda marcado como
 * pendiente y se despacha a mano, que es como estaba antes. Existe para poder
 * desplegar el código y encenderlo cuando se quiera, no al revés.
 */
/**
 * Deja el pedido listo para que la barrida lo despache. No toca la red.
 *
 * Es lo que corre dentro del checkout. Despachar ahí mismo se probó y añadía
 * entre 4 y 10 segundos a la respuesta, contra un límite de función de 15: un
 * mal momento de la API y la clienta veía un error por un pedido que sí se
 * había creado, con lo cual lo intentaba otra vez.
 *
 * El cron pasa cada cinco minutos y los pedidos esperan confirmación por
 * WhatsApp de todos modos, así que ese retraso no le cuesta nada a la operación
 * y el checkout vuelve a responder en un segundo.
 */
export async function marcarParaDespacho(order) {
  if (!order || order.duplicate) return { marcado: false };
  const impedimento = puedeEnviarse(order);
  if (impedimento) {
    await anotar(order.id, 'manual', impedimento, null);
    return { marcado: false, motivo: impedimento };
  }
  await anotar(order.id, 'pendiente', 'en cola para Mastershop', null);
  return { marcado: true };
}

export async function despacharPedido(order) {
  if (!order || order.duplicate) return { enviado: false, motivo: 'pedido repetido' };

  // Lo que no puede despacharse solo no es un fallo: es un pedido que se sube a
  // mano, como los de transferencia. Distinguirlo importa porque «fallido»
  // invita a reintentar algo que nunca va a salir, y en el panel se lee como si
  // algo estuviera roto.
  const impedimento = puedeEnviarse(order);
  if (impedimento) {
    await anotar(order.id, 'manual', impedimento, null);
    return { enviado: false, motivo: impedimento };
  }

  if (process.env.MASTERSHOP_AUTO !== '1') {
    await anotar(order.id, 'pendiente', 'envío automático apagado', null);
    return { enviado: false, motivo: 'envío automático apagado' };
  }

  // Primer intento de un pedido recién creado: no puede estar ya en Mastershop,
  // así que se salta la comprobación y el tiempo se gasta en crearlo. Cualquier
  // otro caso —un reintento— sí la hace.
  const primerIntento = !order.mastershop_status;
  const r = await enviarPedido(order, { comprobarDuplicado: !primerIntento });
  await anotar(
    order.id,
    r.enviado || r.duplicado ? 'enviado' : 'fallido',
    r.motivo || '',
    r.idOrder
  );
  return r;
}

/**
 * Reintenta los que quedaron fallidos o pendientes.
 *
 * Se limita a 20 por pasada porque el límite de la API es de 500 peticiones por
 * minuto y cada pedido gasta dos: la comprobación de duplicado y la creación.
 */
export async function reintentarPendientes(limite = 20) {
  const filas = await all(
    `SELECT * FROM orders
     WHERE status != 'cancelled'
       AND (mastershop_status IS NULL OR mastershop_status IN ('pendiente', 'fallido'))
       AND payment_method = 'cod'
     ORDER BY created_at ASC LIMIT ?`,
    [limite]
  );

  // Presupuesto de tiempo, no sólo de cantidad.
  //
  // Cada pedido gasta dos llamadas a Mastershop y la función de Vercel se corta
  // a los 15 s. Sin este freno, cuatro pedidos atascados bastaban para que la
  // barrida entera muriera con un 504 — y como moría antes de escribir nada, se
  // quedaban atascados indefinidamente por más que el cron pasara cada cinco
  // minutos. Lo que no dé tiempo hoy lo recoge la pasada siguiente.
  const LIMITE_MS = 10_000;
  const arranque = Date.now();

  const salida = [];
  for (const o of filas) {
    if (Date.now() - arranque > LIMITE_MS) {
      salida.push({ code: o.code, enviado: false, motivo: 'sin tiempo en esta pasada, sigue en la siguiente' });
      break;
    }
    salida.push({ code: o.code, ...(await despacharPedido(o)) });
  }
  return salida;
}

/** Cómo va el despacho automático, para el panel. */
export async function resumenDespacho() {
  const filas = await all(
    `SELECT COALESCE(mastershop_status, 'sin intentar') estado, COUNT(*) n
     FROM orders WHERE status != 'cancelled' GROUP BY 1 ORDER BY n DESC`
  );
  const ultimo = await one(
    `SELECT code, mastershop_status, mastershop_note, mastershop_at
     FROM orders WHERE mastershop_at IS NOT NULL ORDER BY mastershop_at DESC LIMIT 1`
  );
  return { por_estado: filas, ultimo };
}
