# DropStudio

Plataforma para **testear productos rápido**: montas una landing, lanzas tráfico,
recibes pedidos contra entrega y sabes en el mismo panel si el producto vale la
pena escalar o descartar.

La landing de **Plasma — Remolacha Orgánica** ya viene montada, publicada y
conectada al backend. Puedes empezar el testeo hoy mismo.

---

## Arrancar

```bash
npm start
```

Sin `npm install`: no hay dependencias. Sólo requiere **Node 22.5+** (usa el
módulo `node:sqlite` incorporado).

| | |
|---|---|
| **Panel** | http://127.0.0.1:4321 |
| **Landing en vivo** | http://127.0.0.1:4321/p/plasma-corazon |
| **Acceso** | `admin@dropstudio.co` / `admin123` |

Otros comandos:

```bash
npm run dev     # recarga automática al editar el servidor
npm run reset   # borra la base y vuelve a sembrarla desde cero
```

---

## Antes de tu primer testeo real

1. **Borra los datos de demostración.** El panel arranca con ~70 días de pedidos,
   visitas e inversión simulados para que veas todos los módulos funcionando.
   Ve a **Ajustes → Datos de demostración → Borrar**. Tu producto, tu testeo
   `T-001` y la landing de Plasma se conservan intactos.
2. **Revisa la economía del producto.** En **Productos → Plasma**, ajusta el
   *costo del producto* y el *costo de envío* — vienen con valores estimados
   ($22.000 y $12.000). De ahí sale tu margen y tu **CPA de equilibrio**, que es
   el número que decide si un testeo es ganador.
3. **Fija el CPA objetivo del testeo.** En **Testeos → T-001 → Editar**. El panel
   compara el CPA real contra esa meta y te dice si vas bien.
4. **Registra la inversión a diario.** En el detalle del testeo, *Registrar
   inversión*. Sin ese dato el CPA y el ROAS son ficción.

---

## Módulos

**Operación**
- **Panel** — KPIs del periodo, pedidos e inversión por día, embudo y testeos activos.
- **Pedidos** — pipeline completo del contra entrega (pendiente → confirmado →
  alistado → en camino → entregado / devuelto / cancelado), acciones en lote,
  detalle con historial, y exportación a CSV.
- **Clientes** — ficha por teléfono, historial de compras y recurrencia.
- **Logística** — tasa de entrega, desempeño por transportadora y cola de despacho.

**Catálogo**
- **Productos** — costo, precio, margen, CPA de equilibrio y ofertas por paquete.
  Las ofertas alimentan el selector de la landing.
- **Páginas** — landings con URL pública propia, editor de HTML, vista previa en
  móvil, duplicado para crear variantes y publicación con un clic.

**Crecimiento**
- **Testeos** — el núcleo. Hipótesis, presupuesto, CPA objetivo, embudo completo
  del anuncio a la entrega, veredicto (ganador / iterar / descartar) y
  aprendizajes.
- **Analíticas** — ingresos, tráfico, conversión, dispositivos, ciudades y fuentes.
- **Finanzas** — de lo cobrado a la utilidad neta, y rentabilidad por testeo.

**Próximamente** (visibles en el panel, aún sin funcionalidad)
- **Test A/B** — reparto automático de tráfico y significancia estadística.
- **Anuncios con IA** — ángulos, ganchos y guiones a partir de tu producto.

---

## Las 4 variantes de Plasma

Todas salen del mismo generador (`server/landing/plasma.js`): mismo diseño, mismo
producto y misma oferta. Lo único que cambia es **con qué argumento se abre** y
**en qué orden llega la información** — así el testeo aísla el ángulo y no el
maquetado.

| | URL | Ángulo | Qué prueba |
|---|---|---|---|
| **A** | `/p/plasma-corazon` | Científico | El mecanismo (óxido nítrico) da credibilidad a tráfico frío |
| **B** | `/p/plasma-energia` | Beneficio | El dolor cotidiano + prueba social arriba convierte más que la ciencia |
| **C** | `/p/plasma-cardiologo` | Autoridad | Abrir con el médico baja la desconfianza del público 50+ medicado |
| **D** | `/p/plasma-oferta` | Precio | Oferta arriba y página corta para retargeting o tráfico sensible al precio |

Para añadir o editar una variante, toca `VARIANTS` en `server/landing/plasma.js`:
declara su copy y el `order` de secciones. Las secciones disponibles están en
`SECTIONS`, en el mismo archivo.

### Cómo repartir el tráfico hoy

Un conjunto de anuncios por variante, cada uno apuntando a su URL. El panel
atribuye visitas y pedidos a la página correcta automáticamente. El reparto desde
una sola URL llegará con el módulo de A/B.

## La landing de Plasma

Se genera desde `server/landing/plasma.js` — ahí vives el copy, la estructura y el
CSS. Editar ese archivo y correr `npm run reset` regenera la página.

Estructura de respuesta directa, en este orden:

1. Promesa + producto + reversión de riesgo (hero)
2. Cifras de confianza (INVIMA, 2040 mg, garantía)
3. **Problema** — que el lector se reconozca
4. Mecanismo (óxido nítrico)
5. Beneficios
6. **Autoridad médica con rostro**
7. CTA intermedio
8. Prueba social + diferenciación
9. **4 testimonios con foto**
10. Antes / después · regalos
11. Oferta con anclaje de precio
12. **Cómo se toma** y **cómo funciona el pago contra entrega**
13. **Garantía de 30 días**
14. FAQ (7 objeciones, incluidas las de contra entrega) + cierre

Las imágenes viven en `data/assets/` y se sirven en `/assets/*` con caché
inmutable. El HTML pesa 53 KB — antes iban embebidas en base64 y pesaba 532 KB.

### Pendientes antes de pautar

- **Registro médico del Dr. Direr.** Está como `[PENDIENTE]` en el bloque de
  autoridad; reemplázalo por el número real.
- **Testimonios.** Los textos actuales son plantillas de estructura. El Estatuto
  del Consumidor (Ley 1480 de 2011, art. 30) exige que un testimonio publicitario
  corresponda a un cliente real y verificable. Cámbialos por los tuyos.

## Cómo se conecta una landing al backend

Al publicar una página, el servidor inyecta `runtime.js` antes de `</body>`.
Ese runtime se encarga de la sesión, los UTMs, los eventos del embudo
(`pageview`, `scroll_50`, `cta_click`, `checkout_open`, `order`) y del envío del
pedido. **No tienes que tocar JavaScript.**

Para que una landing nueva funcione, su HTML sólo necesita estas marcas:

| Marca | Dónde |
|---|---|
| `data-ds-form` | en el `<form>` que contiene el checkout |
| `data-ds-submit` | en el botón de confirmar |
| `data-ds-offer` | en el `<select>` de ofertas (los `<option>` llevan `value` = id de la oferta) |
| `name="customer_name"` | campo de nombre |
| `name="phone"` | campo de teléfono |
| `name="department"` `name="city"` `name="address"` | campos de entrega |

Cualquier enlace `href="#pedir"` cuenta como clic en CTA automáticamente.
La landing de Plasma ya trae todo esto.

**Preview:** una página en borrador se ve en `/p/slug?preview=1` (sólo con sesión
iniciada) y **no** contamina las métricas.

---

## Arquitectura

```
server/
  index.js        arranque, router y servido de estáticos
  config.js       puerto, estados del pedido, veredictos
  db.js           esquema SQLite + helpers de consulta
  seed.js         siembra inicial y purga de datos demo
  lib/            router HTTP, utilidades (ids, dinero, fechas, hashing)
  api/            auth · products · orders · pages · tests · analytics · track
app/
  index.html      shell del panel
  runtime.js      tracking + envío de pedido inyectado en las landings
  css/app.css     sistema de diseño (tokens, componentes, modo oscuro)
  js/
    core.js       DOM, formato, cliente API, estado, tema, toasts
    ui.js         componentes (tabla, drawer, modal, campos, stat tiles)
    charts.js     gráficos SVG sin dependencias
    views/        una vista por módulo
data/
  drop.db         base SQLite
  pages/*.html    HTML de cada landing
```

**Sin build step y sin dependencias.** El panel son módulos ES nativos; el
backend usa `node:http` y `node:sqlite`. Editas un archivo, recargas, listo.

Todo el dinero se guarda como **entero en pesos** (sin decimales) para evitar
errores de coma flotante.

---

## Notas para el despliegue

Ya hay base de datos real (SQLite en `data/drop.db`), así que desplegar es
sobre todo mover el proceso a un servidor:

- Sirve detrás de un proxy con HTTPS y ajusta `PORT` / `HOST` por entorno.
- La cookie de sesión es `HttpOnly` + `SameSite=Lax`; en producción conviene
  añadirle `Secure`.
- Cambia la contraseña del usuario `admin` desde **Ajustes → Equipo**.
- Para migrar a Postgres, el único archivo que cambia es `server/db.js`: el resto
  de la API usa sus helpers `all` / `one` / `run` / `insert` / `update`.
- Haz backup de `data/` — ahí viven la base y el HTML de las landings.
