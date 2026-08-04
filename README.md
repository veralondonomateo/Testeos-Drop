# DropStudio

Plataforma para **testear productos rápido**: montas una landing, lanzas tráfico,
recibes pedidos contra entrega y sabes en el mismo panel si el producto vale la
pena escalar o descartar.

Corre sobre **Vercel + Supabase**.

---

## Verlo funcionando en 1 minuto

Sin Supabase, sin configurar nada:

```bash
npm install
npm run demo
```

Levanta un Postgres local, siembra datos de demostración y abre el panel en
<http://127.0.0.1:4321>.

```
Correo       admin@dropstudio.co
Contraseña   demo1234
```

Es sólo para mirar: los datos viven en `.demo-db/` y no tocan tu despliegue.
Para producción, sigue con Supabase abajo.

---

## Desplegar

### 1. Base de datos (Supabase)

Crea un proyecto y copia la cadena de conexión desde
**Project Settings → Database → Connection string → Transaction pooler**.

> Usa el puerto **6543** (pooler), no el 5432. Desde funciones serverless una
> conexión directa agota el pool de Postgres en cuanto Vercel escala.

### 2. Migración

```bash
npm install
cp .env.example .env      # pega tu DATABASE_URL y tu ADMIN_PASSWORD
npm run migrate           # crea el esquema y siembra producto, testeo y 4 landings
```

`migrate` es idempotente: si ya hay datos, no toca nada.

### 3. Vercel

Importa el repo y configura:

| Campo | Valor |
|---|---|
| Root Directory | `./` |
| Framework Preset | Other |
| Build Command | *(vacío)* |
| Output Directory | *(vacío)* |
| Node.js Version | 22.x |

Variables de entorno (**Settings → Environment Variables**):

| Variable | Valor |
|---|---|
| `DATABASE_URL` | la del pooler de Supabase (6543) |
| `ADMIN_EMAIL` | tu correo |
| `ADMIN_PASSWORD` | una contraseña fuerte |

> **Los accesos al panel los crea `npm run migrate`**, con esas dos variables.
> No hay usuario por defecto en el código: si la migración no ha corrido, la
> tabla `users` no existe y el login responde 500. Y una vez creado el usuario,
> volver a migrar con otra contraseña **no** la cambia.

El enrutado lo define `vercel.json`: `/api/*` y `/p/*` van a la función
serverless, todo lo demás lo sirve el CDN desde `public/`.

### Si algo falla

Abre `https://tu-dominio.vercel.app/api/health`. Es público y no expone secretos;
te dice exactamente qué falta:

```json
{ "database_url": "FALTA",  "siguiente_paso": "Añade DATABASE_URL en Vercel…" }
{ "esquema": "FALTA",       "siguiente_paso": "Falta correr `npm run migrate`" }
{ "ok": true }
```

La causa más común de un **500 al iniciar sesión** es que la migración no se
corrió contra Supabase: la base existe pero no tiene tablas.

### Correr en local

```bash
npm start     # http://127.0.0.1:4321
npm run dev   # con recarga automática
```

Usa el mismo `DATABASE_URL` de Supabase, o cualquier Postgres local.

---

## Arquitectura

```
public/            servido por el CDN de Vercel, sin pasar por la función
  index.html       panel (SPA con enrutado por hash)
  css/ js/         código del panel
  runtime.js       tracking + envío de pedido que se inyecta en las landings
  assets/          imágenes del producto, del médico y de los testimonios

api/index.js       punto de entrada de Vercel — reexporta el handler

server/
  index.js         router + handler HTTP (sin listen en producción)
  db.js            capa Postgres: esquema y helpers
  migrate.js       `npm run migrate`
  seed.js          siembra inicial y datos de demostración
  config.js        puerto, estados del pedido, veredictos
  landing/         generador de las 4 variantes de Plasma
  api/             auth · products · orders · pages · tests · analytics · track
```

**Dónde vive el estado.** Todo en Postgres, incluido el **HTML de cada landing**
(columna `pages.html`). No se escribe nada a disco: en serverless el sistema de
archivos es de solo lectura y no se comparte entre invocaciones, así que guardar
las páginas en la base es lo único que permite editarlas desde el panel.

**Dinero en enteros.** Todos los montos se guardan como enteros de pesos, sin
decimales, para evitar errores de coma flotante.

**Fechas en TEXT ISO 8601.** Ordenan y comparan lexicográficamente igual que
cronológicamente, así que la analítica agrupa por día con `substr()` sin
conversiones.

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

---

## Antes de tu primer testeo real

1. **Borra los datos de demostración.** Ajustes → Datos de demostración. Tu
   producto, tu testeo `T-001` y las 4 landings se conservan.
2. **Ajusta el costo real del producto.** Productos → Plasma. De ahí sale tu
   margen y tu **CPA de equilibrio**, que es el número que decide si un testeo gana.
3. **Fija el CPA objetivo del testeo.** Testeos → T-001 → Editar.
4. **Registra la inversión a diario.** Sin ese dato el CPA y el ROAS son ficción.
5. **Registro médico del Dr. Direr.** Está como `[PENDIENTE]` en el bloque de
   autoridad de las landings; reemplázalo por el número real.
6. **Testimonios reales.** Los textos actuales son plantillas de estructura. El
   Estatuto del Consumidor (Ley 1480 de 2011, art. 30) exige que un testimonio
   publicitario corresponda a un cliente real y verificable.

### Pendiente de instrumentación

El **píxel de Meta no se inyecta** en las landings todavía. Los IDs se guardan en
Ajustes, pero ninguna página los emite: sin eso Meta sólo puede optimizar a clics
o vistas de página, no a compra.
