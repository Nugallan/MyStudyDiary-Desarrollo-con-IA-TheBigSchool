# Tasks 001 - Mapa de calor de constancia

- Spec: `specs/001-heat-map/spec.md` (revisión 2)
- Plan: `specs/001-heat-map/plan.md`
- Orden: T1 → T2 → T3 → T4 → T5 → T6

| Tarea | Qué hace | RF / RNF | Estado |
|---|---|---|---|
| T1 | `logic.js` (fechas + mapa, puro) y `logic.test.js`; `node --test` en verde | RF-2…RF-6, RF-8, RF-9, RF-12; RNF-2, RNF-6, RNF-7 | **hecho** (2026-10-17, `node --test` 20/20) |
| T2 | `index.html`: sección entre racha y formulario; cargar `logic.js` antes de `app.js` | RF-1, RNF-1 | pendiente |
| T3 | `styles.css`: rejilla, 5 niveles, leyenda, detalle y 375 px | RF-4, RF-7; RNF-1, RNF-4, RNF-8 | pendiente |
| T4 | `app.js`: pintar el mapa, detalle (puntero/toque) y actualizar al guardar | RF-1, RF-6, RF-10, RF-11; RNF-4 | pendiente |
| T5 | `AGENTS.md` (lista de archivos) y `MEMORY.md` | RNF-1 | pendiente |
| T6 | Verificación manual con Chrome DevTools (incluida vista de 375 px) | RF-1, RF-6, RF-7, RF-10, RF-11; RNF-4, RNF-5, RNF-8 | pendiente |

## Detalle

### T1 - Lógica pura y tests

- Crear `logic.js`: funciones puras de fecha y del mapa, sin DOM ni `localStorage`; las que dependen del tiempo reciben `todayISO`.
- Crear `logic.test.js` con el runner de Node (`node --test`), con `todayISO` fijo.
- Criterio: `node --test` en verde.

### T2 - Marcado

- Añadir `.heat-card` entre `.streak-card` y `.form-card`, con `#heatmap`, `#heatmapDetail` y la leyenda.
- Cargar `logic.js` antes de `app.js`.

### T3 - Estilos

- Rejilla 12×7, niveles 0–4, leyenda, línea de detalle y responsive a 375 px.

### T4 - Interfaz

- `renderHeatMap()`, detalle con puntero/toque y `updateHeatMap()` al cargar y al guardar.

### T5 - Documentación

- Actualizar `AGENTS.md` y `MEMORY.md`.

### T6 - Verificación manual

- Sin datos, un día de nivel máximo, una sesión futura, guardar sin recargar, consola limpia y 375 px sin desbordes.
