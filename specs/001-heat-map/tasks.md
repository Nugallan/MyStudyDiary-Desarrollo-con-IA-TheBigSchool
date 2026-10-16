# Tasks 001 - Mapa de calor de constancia

- Spec: `specs/001-heat-map/spec.md` (revisión 2)
- Plan: `specs/001-heat-map/plan.md`
- Orden: T1 → T2 → T3 → T4 → T5 → T6

| Tarea | Qué hace | RF / RNF | Estado |
|---|---|---|---|
| T1 | `logic.js` (fechas + mapa, puro) y `logic.test.js`; `node --test` en verde | RF-2…RF-6, RF-8, RF-9, RF-12; RNF-2, RNF-6, RNF-7 | **hecho** (2026-10-17, `node --test` 20/20) |
| T2 | `index.html`: sección entre racha y formulario; cargar `logic.js` antes de `app.js` | RF-1, RNF-1 | **hecho** (2026-10-17) |
| T3 | `styles.css`: rejilla, 5 niveles, leyenda, detalle y 375 px | RF-4, RF-7; RNF-1, RNF-4, RNF-8 | **hecho** (2026-10-17) |
| T4 | `app.js`: pintar el mapa, detalle (puntero/toque) y actualizar al guardar | RF-1, RF-6, RF-10, RF-11; RNF-4 | **hecho** (2026-10-17) |
| T5 | `AGENTS.md` (lista de archivos) y `MEMORY.md` | RNF-1 | **hecho** (2026-10-17) |
| T6 | Verificación manual con Chrome DevTools (incluida vista de 375 px) | RF-1, RF-6, RF-7, RF-10, RF-11; RNF-4, RNF-5, RNF-8 | **hecho** (2026-10-17) |

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

## Resultado (2026-10-17)

- `node --test` en verde: 20 tests de `logic.test.js`.
- Chrome DevTools (`file://`): 12 semanas y 84 celdas; 30 y 45 min → nivel 2, 60 min → nivel 3, 125 min → nivel 4; ventana 27/07/2026–18/10/2026.
- Detalle: puntero → `14/10/2026, 60 minutos`; toque → `15/10/2026, 45 minutos`; toque fuera → vacío.
- Guardar sin recargar actualiza el mapa y la lista; con minutos inválidos no cambia nada y el foco va al campo.
- Consola sin mensajes. Móvil con emulación de 375 px: sin desbordes y celdas cuadradas (22 px); leyenda en 2 filas.
- Colores forzados: los cinco niveles siguen distinguiéndose (trazo punteado → relleno).
