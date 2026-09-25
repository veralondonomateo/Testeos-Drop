# Dermafol Brand Ritual — borrador privado

Versión adicional; no reemplaza ninguna de las nueve páginas anteriores ni participa en tests activos.

- Panel: https://testeos-drop.vercel.app/#/pages/pag_dermafol_brand_private
- Preview con sesión: https://testeos-drop.vercel.app/p/dermafol-360-brand?preview=1
- ID: `pag_dermafol_brand_private`; tienda: `tnd_dermafol`; estado: `draft`.
- Código: `server/landing/dermafol-brand/`; imágenes: `public/assets/dermafol-brand/`.

## Estructura

Atención: hero con kit real, tres beneficios, oferta y CTA. Transformación: relación con el cabello. Interés: suplemento y Roll-On, ingredientes. Deseo: seguimiento por etapas y cartas de regalos. Confianza: 20 testimonios con sus fotos, 6 reels existentes, imágenes de los 6 ingredientes y y garantía existente de 90 días. Objeciones: preguntas frecuentes. Acción: selector 1/2/3, pago, carrito lateral y CTA fijo.

Ofertas: 139.900 / 199.900 / 249.900 COP. Tres kits preseleccionados. Regalos base 1/3/5, valores 15.000 / 57.800 / 117.600. Anticipado añade gorro de 39.900. Precios unitarios 139.900 / 99.950 / 83.300. Costos internos excluidos del HTML. Cartas deterministas según plan, sin azar ni urgencia ficticia.

El formulario simula la confirmación; jamás crea pedidos ni cobra, incluso si accidentalmente se publica este borrador. Conexión de contraentrega y Mercado Pago/Wompi pendiente de una fase posterior. No publicar como campaña activa antes de conectar y comprobar el checkout real.

12 semanas se presenta como periodo de constancia/seguimiento, no como duración completa del ciclo folicular ni garantía de crecimiento. Las reseñas y garantía proceden del contenido existente. No se añadieron estadísticas de resultados ficticias.

## Imágenes y referencias

Fotos reales de producto y lifestyle y logotipo del material autorizado Dermafol. Tipografía DM Sans y colores de la tienda actual, sin mezcla con serif. Miniaturas de regalos creadas con Higgsfield GPT Image 2.5; son mockups ilustrativos, indicado junto a la oferta. Job: 200b8596-2aae-4bcf-bf92-b25b19e0b5cc. WebP responsive, lazy loading salvo hero; videos cargan al pulsar.

Referencias de dirección visual: https://seed.com/ , https://nutrafol.com/ , https://wellbel.com/ , https://magicmind.com/ , https://drinkag1.com/es-eu , https://physicianschoice.com/ , https://opositiv.com/ , https://www.maryruthorganics.com/ , https://spacegoods.com/ , https://bloomnu.com/ . Cartas y escalera de regalos inspiradas en las capturas aportadas de https://droff.co/products/droff-juega-y-gana . No se copiaron sus testimonios ni métricas.

## Desarrollo y comprobación

`node scripts/preview-dermafol-brand.mjs` abre servidor aislado localhost:4332 sin DB ni creación de pedidos.

`node scripts/check-dermafol-brand.mjs` comprueba las seis combinaciones, totales, precios unitarios, selección inicial, aislamiento del checkout y recursos.

`node --env-file=.env scripts/save-dermafol-brand-draft.mjs` guarda únicamente este borrador. Se niega a sobrescribirlo si está publicado y verifica hashes de todas las demás páginas antes/después dentro de la transacción. No migra el esquema.

Pruebas de navegador: carrito y pagos sincronizados, confirmación ficticia, cartas reveladas, ausencia de desbordamiento horizontal a 320 y 390 px, galería y regalos dentro del selector inicial en móvil, escritorio 1280 px y tableta 768 px. Navegación por teclado, foco de dialog y reducción de movimiento implementados. Header y footer con navegación real de Dermafol. Ahorro por volumen calculado contra kits individuales a 139.900, separado del valor de regalos.
