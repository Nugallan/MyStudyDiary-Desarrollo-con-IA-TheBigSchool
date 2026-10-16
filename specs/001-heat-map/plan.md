# Plan 001 - Mapa de calor de constancia

- Estado: listo para revisión
- Fecha: 2026-10-17
- Spec: `specs/001-heat-map/spec.md` (revisión 2)

## 1. Resumen

Añadir un mapa de calor de 12 semanas (lunes–domingo) con 5 niveles de intensidad por minutos estudiados. La parte de cálculo se separa de la interfaz en un módulo puro y con tests, según la Constitución (principios 3 y 4).

Sin dependencias nuevas ni build: un archivo `logic.js` cargado con una etiqueta `<script>` y probado con `node --test`.

## 2. Archivos afectados

| Archivo | Acción |
|---|---|
| `logic.js` | **Nuevo**. Funciones puras (fechas + cálculo del mapa), sin DOM ni almacenamiento |
| `logic.test.js` | **Nuevo**. Tests con el runner de Node (`node --test`) |
| `index.html` | Añadir la sección del mapa y cargar `logic.js` antes de `app.js` |
| `styles.css` | Estilos de rejilla, niveles, leyenda, detalle y responsive |
| `app.js` | Pintar el mapa, detalle al puntero/toque y actualización al guardar |
| `AGENTS.md` | Añadir `logic.js` a la lista de archivos |
| `MEMORY.md` | Estado y decisiones al terminar |

> Crear `logic.js` añade un archivo al proyecto (hoy solo hay `index.html`, `styles.css` y `app.js`). Es la forma de cumplir "lógica sin DOM ni `localStorage`" y de poder testearla. Requiere actualizar la lista de archivos de `AGENTS.md`.

## 3. Arquitectura

Dos capas:

- **Lógica pura (`logic.js`)**: recibe datos como argumentos y devuelve datos. No toca el DOM, no lee `localStorage` y **no llama a `new Date()` sin argumentos**: recibe `todayISO` como parámetro.
- **Interfaz (`app.js`)**: lee/guarda sesiones, pinta el DOM y conecta los eventos. Llama a las funciones puras.

`logic.js` funciona en el navegador (funciones globales, disponibles para `app.js`) y en Node (exporta con `module.exports` para los tests). Mismo archivo, sin duplicar código ni añadir herramientas.

```
index.html
  <script src="logic.js"></script>   <!-- puro -->
  <script src="app.js"></script>     <!-- DOM + localStorage -->

logic.test.js  →  require("./logic.js")  →  node --test
```

## 4. API de `logic.js`

### Fechas (todas locales, según las reglas del proyecto)

- `toISODate(date)` → `"AAAA-MM-DD"` con `getFullYear()`, `getMonth()+1`, `getDate()` y `padStart`.
- `parseISODate(iso)` → `new Date(año, mes-1, día)` o `null` si no es válido (se comprueba que el resultado coincide con el texto). Nunca `new Date("AAAA-MM-DD")`.
- `addDays(date, n)` → `setDate(getDate() + n)`, nunca milisegundos.
- `isValidISODate(iso)` → booleano.
- `getWeekStartISO(iso)` → lunes de la semana que contiene `iso` (`offset = (getDay()+6) % 7`).
- `formatDisplayDate(iso)` → `"DD/MM/AAAA"` (se reutiliza también en la lista de sesiones para no duplicar).

### Mapa de calor

- `classifyLevel(minutes)` → entero 0–4: 0 → 0; 1–29 → 1; 30–59 → 2; 60–119 → 3; ≥120 → 4. Minutos no válidos → se tratan como 0 en el recuento.
- `minutesByDay(sessions)` → resumen fecha → total de minutos. Sin sesiones inválidas; suma varias sesiones del mismo día.
- `buildHeatMap(sessions, todayISO)` → `{ startISO, endISO, weeks }`, donde `weeks` es un array de 12 semanas y cada semana un array de 7 celdas `{ date, minutes, level }` (lunes→domingo).

Reglas de `buildHeatMap` (derivadas de la spec):

- `startISO` = lunes de la semana de `todayISO` menos 11 semanas; `endISO` = `startISO + 83` días (domingo de la semana de hoy).
- Siempre 84 celdas.
- Una celda por día; minutos = suma de sus sesiones; nivel = `classifyLevel(minutos)`.
- Sesiones fuera de `[startISO, endISO]` (pasadas o futuras) se ignoran.
- Un día con 0 minutos es nivel 0, tenga o no sesión.

## 5. Interfaz (`app.js`)

- Nuevos elementos del DOM: `#heatmap` (rejilla), `#heatmapDetail` (línea de detalle, con `aria-live="polite"`).
- `renderHeatMap()`: llama a `buildHeatMap(sessions, getTodayISO())` y crea 12 columnas × 7 celdas. Cada celda: `<div class="heat-cell level-N" data-date="AAAA-MM-DD" aria-label="DD/MM/AAAA, 45 minutos">` (o `"…, sin estudio"`). Orden del DOM = semana a semana y, dentro, lunes→domingo, para que el orden de lectura coincida con el visual.
- `showHeatDetail(date)`: pinta la fecha y los minutos con la pluralización de la app.
- Eventos: `pointerenter` por celda → mostrar detalle; `click` (toque) → mostrar/actualizar; `click` fuera del mapa → ocultar.
- `updateHeatMap()`: se llama en `init()` y al final de `handleSubmit()` (tras guardar). No hay temporizadores: "hoy" se fija al cargar y al guardar.
- Reutilizar `sessions`, `getTodayISO()` y `formatDisplayDate()` ya existentes; no cambiar el formato de datos guardados.

## 6. Estilos (`styles.css`)

- `.heatmap`: rejilla de 12 columnas × 7 filas, `gap` pequeño, ancho ajustado para no desbordar a 375 px.
- `.heat-cell`: cuadrado de lado fijo; `--level-0` = color de papel/regla; `--level-1..4` = misma tonalidad con intensidad creciente (la tinta azul-negra de la paleta del cuaderno).
- `.heat-legend`: cinco muestras con su rango ("0 min", "1–29", "30–59", "60–119", "≥120") de "menos" a "más".
- `.heat-detail`: una línea de texto; oculta cuando no hay nada que mostrar.
- Niveles distinguibles en escala de grises (variar además la luminosidad, no solo la saturación); alto contraste forzado respetado.
- A 375 px: 12 columnas deben caber sin scroll horizontal.

## 7. Tests (`logic.test.js`) con `node --test`

Se escriben con un `todayISO` fijo (por ejemplo `"2026-10-17"`) para que sean deterministas:

- `classifyLevel`: límites 0, 1, 29, 30, 59, 60, 119, 120 y un valor muy alto.
- `minutesByDay`: suma de varias sesiones el mismo día; ignora minutos no válidos.
- `buildHeatMap`:
  - devuelve 84 celdas, 12 semanas de 7 días;
  - primera celda = lunes 11 semanas antes; última = domingo de la semana de hoy;
  - sesión en el lunes inicial y en el domingo final → entran; fuera → no afectan;
  - sesión futura dentro de la semana → entra; futura tras el domingo → se ignora;
  - sesión con 0 minutos → nivel 0;
  - misma llamada dos veces → mismo resultado (determinista).
- Fechas: `todayISO` en lunes y en domingo; semana que cruza de mes y de año; comprobación de que no se usa UTC (un día con hora 00:30 no se desplaza).

Ningún test toca el DOM ni `localStorage`. No se instala nada: `node --test`.

## 8. Cumplimiento de la Constitución

- **P1**: sin dependencias ni build; `logic.js` es un `<script>` más y se sigue abriendo con doble clic.
- **P3**: los cálculos son funciones puras, sin DOM ni `localStorage`, que reciben `todayISO`.
- **P4**: la lógica se cubre con `node --test`; no se avanza con tests en rojo.
- **P5**: el mapa es de solo lectura; no se crea ni se modifica información guardada.
- **P6**: identificadores en inglés, textos en español.

## 9. Orden de trabajo

1. `logic.js` (fechas + mapa) y `logic.test.js`; dejar los tests en verde.
2. `index.html`: sección del mapa entre `.streak-card` y `.form-card`; cargar `logic.js` antes de `app.js`.
3. `styles.css`: rejilla, niveles, leyenda, detalle y responsive.
4. `app.js`: pintar, detalle y actualización al guardar.
5. `AGENTS.md` (lista de archivos) y `MEMORY.md`.
6. Verificación manual con el MCP de Chrome DevTools.

## 10. Verificación manual (Chrome DevTools)

- Sin datos: 84 celdas en nivel 0 y leyenda visible.
- Un día con ≥120 min → nivel máximo; comprobar el detalle al pasar el puntero y al tocar.
- Una sesión con fecha futura dentro de la semana → celda coloreada; una más allá del domingo → fuera.
- Guardar una sesión → el mapa se actualiza sin recargar.
- 375 px: sin desbordamiento horizontal; consola sin errores.

## 11. Riesgos y dudas

- **Nuevo archivo `logic.js`**: implica actualizar la lista de archivos de `AGENTS.md` (hoy dice "más los tests `*.test.js`"). Es el único cambio estructural.
- **Doble uso (navegador/Node)**: depende de exportar en `logic.js` solo cuando exista `module`; hay que comprobar que en el navegador sigue habiendo funciones globales.
- **Repintado del mapa** al guardar: ha de reutilizar la fecha actual sin recargar.
- **Sin temporizadores**: si la pestaña cruza la medianoche abierta, el mapa no se reancla (aceptado en la spec).
