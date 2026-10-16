# Plan 001 - Mapa de calor de constancia

- Estado: listo para revisión
- Fecha: 2026-10-17
- Spec: `specs/001-heat-map/spec.md` (revisión 2)
- Constitución: `docs/constitution.md`

## 1. Mapa de cobertura

Cada parte de este plan cubre estos requisitos:

| Bloque del plan | RF / RNF que cubre |
|---|---|
| `logic.js` (funciones de fecha) | RF-2, RF-9, RNF-2, RNF-7 |
| `logic.js` (funciones del mapa) | RF-3, RF-4, RF-5, RF-8, RF-9, RF-12, RNF-7 |
| `index.html` (sección + orden de scripts) | RF-1, RNF-1 |
| `app.js` (pintado + eventos) | RF-1, RF-6, RF-10, RF-11, RNF-4 |
| `styles.css` | RF-4, RF-7, RNF-1, RNF-4, RNF-8 |
| `logic.test.js` | RNF-6 (y verificación de RF-2, RF-3, RF-4, RF-5, RF-6, RF-8, RF-9, RF-12) |
| Verificación manual (navegador) | RF-1, RF-6, RF-7, RF-10, RF-11, RNF-4, RNF-5, RNF-8 |

## 2. Archivos: qué cambia y qué responsabilidad tiene cada uno

| Archivo | Acción | Responsabilidad | Cubre |
|---|---|---|---|
| `logic.js` | **Se crea** | Única fuente de los cálculos. Funciones **puras**: no tocan el DOM, no leen ni escriben `localStorage` y **no consultan el reloj por su cuenta** (reciben "hoy" como parámetro). Se usa igual en el navegador (funciones globales) y en Node (exporta para los tests). | RF-2, RF-3, RF-4, RF-5, RF-6, RF-8, RF-9, RF-12, RNF-2, RNF-7 |
| `logic.test.js` | **Se crea** | Tests de la lógica pura con el runner de Node (`node --test`). Sin DOM ni almacenamiento. | RNF-6 |
| `index.html` | **Se modifica** | Añadir la sección del mapa entre la tarjeta de racha y el formulario, y cargar `logic.js` antes de `app.js`. | RF-1, RNF-1 |
| `styles.css` | **Se modifica** | Aspecto de la rejilla, los 5 niveles, la leyenda, la línea de detalle y el comportamiento a 375 px. | RF-4, RF-7, RNF-4, RNF-8 |
| `app.js` | **Se modifica** | Capa de interfaz: leer/guardar sesiones, pedir el mapa a `logic.js`, pintar la rejilla, gestionar el detalle (puntero/toque) y repintar al guardar. | RF-1, RF-6, RF-10, RF-11, RNF-4 |
| `AGENTS.md` | **Se modifica** | Añadir `logic.js` (y `logic.test.js`) a la lista de archivos. | RNF-1 |
| `MEMORY.md` | **Se modifica** | Estado y decisiones al terminar. | — |

Separación de capas (Constitución 3):

```
index.html
  <script src="logic.js">   ← puro (cálculos)
  <script src="app.js">     ← interfaz (DOM + almacenamiento)

logic.test.js  →  carga logic.js  →  node --test
```

> `logic.js` es el único archivo nuevo (además de los tests). Es la forma de cumplir "lógica sin DOM ni `localStorage`" y de poder probarla; obliga a actualizar la lista de archivos de `AGENTS.md`.

## 3. Funciones puras de la lógica (`logic.js`)

Todas las que dependen del tiempo **reciben "hoy" como parámetro** (`todayISO`, texto `AAAA-MM-DD`). Ninguna llama al reloj. Identificadores en inglés, mensajes y textos en español (Constitución 6).

### 3.1 Fechas locales (cubren RF-2, RF-9, RNF-2)

| Función | Entrada | "hoy" | Salida | Notas |
|---|---|---|---|---|
| `toISODate` | fecha | no | `AAAA-MM-DD` | Con `getFullYear()`, `getMonth()+1`, `getDate()` y ceros a la izquierda |
| `parseISODate` | texto `AAAA-MM-DD` | no | fecha o "nada" | Con `new Date(año, mes-1, día)`; **nunca** `new Date("AAAA-MM-DD")` |
| `isValidISODate` | texto | no | verdadero/falso | Válido si la fecha reconstruida coincide con el texto |
| `addDays` | fecha, n | no | fecha | Con `setDate(getDate() + n)`; **nunca** milisegundos |
| `getWeekStartISO` | `todayISO` | **sí** | lunes de esa semana | Desfase `(getDay()+6) % 7` (lunes = 0) |
| `formatDisplayDate` | texto `AAAA-MM-DD` | no | `DD/MM/AAAA` | Se reutiliza también en la lista de sesiones |

### 3.2 Cálculo del mapa (cubren RF-3, RF-4, RF-5, RF-8, RF-9, RF-12, RNF-7)

| Función | Entrada | "hoy" | Salida |
|---|---|---|---|
| `classifyLevel` | minutos | no | nivel 0–4 |
| `formatMinutes` | minutos | no | texto con pluralización ("1 minuto" / "45 minutos") |
| `formatDetail` | fecha + minutos | no | texto del detalle ("17/10/2026, 45 minutos" o "17/10/2026, sin estudio") |
| `minutesByDay` | sesiones | no | minutos totales por fecha |
| `buildHeatMap` | sesiones, `todayISO` | **sí** | `{ startISO, endISO, weeks }`, con 12 semanas de 7 celdas `{ date, minutes, level }` |

`classifyLevel` (RF-4): ≥120 → 4; ≥60 → 3; ≥30 → 2; ≥1 → 1; resto → 0.

`minutesByDay` (RF-3, RF-5, RF-12): recorre las sesiones, ignora las de fecha inválida y las de minutos que no sean entero ≥ 1, y suma los minutos de las que comparten fecha.

`buildHeatMap` (RF-2, RF-8, RF-9): recibe `todayISO` y produce las 84 celdas; las sesiones fuera de `[startISO, endISO]` no encuentran celda y quedan fuera del mapa sin necesidad de un filtro aparte.

## 4. Algoritmo del mapa (pseudocódigo)

```
FUNCIÓN getWeekStartISO(todayISO):
    fecha ← parseISODate(todayISO)
    SI fecha es "nada" ENTONCES DEVOLVER "nada"
    desfase ← (diaDeLaSemana(fecha) + 6) MOD 7      # lunes=0 ... domingo=6
    DEVOLVER toISODate(addDays(fecha, -desfase))    # lunes de la semana de hoy

FUNCIÓN classifyLevel(minutos):
    SI minutos >= 120 ENTONCES DEVOLVER 4
    SI minutos >= 60  ENTONCES DEVOLVER 3
    SI minutos >= 30  ENTONCES DEVOLVER 2
    SI minutos >= 1   ENTONCES DEVOLVER 1
    DEVOLVER 0

FUNCIÓN minutesByDay(sessions):
    totales ← mapa vacío
    PARA CADA sesion EN sessions:
        SI NO isValidISODate(sesion.date) ENTONCES continuar
        SI NO (minutos son entero Y minutos >= 1) ENTONCES continuar
        totales[sesion.date] ← (totales[sesion.date] SI EXISTE, SI NO 0) + sesion.minutes
    DEVOLVER totales

FUNCIÓN buildHeatMap(sessions, todayISO):
    startISO ← getWeekStartISO(todayISO)                       # lunes de hoy
    startISO ← toISODate(addDays(parseISODate(startISO), -7*11))  # 11 semanas antes
    endISO   ← toISODate(addDays(parseISODate(startISO), 83))     # domingo de la semana de hoy
    totales  ← minutesByDay(sessions)

    weeks ← lista vacía
    fecha ← parseISODate(startISO)
    PARA semana DESDE 1 HASTA 12:
        dias ← lista vacía
        PARA dia DESDE 1 HASTA 7:
            iso ← toISODate(fecha)
            minutos ← (totales[iso] SI EXISTE, SI NO 0)
            dias.añadir { date: iso, minutes: minutos, level: classifyLevel(minutos) }
            fecha ← addDays(fecha, 1)
        weeks.añadir dias

    DEVOLVER { startISO, endISO, weeks }
```

Propiedades del algoritmo:

- **Siempre 84 celdas** (12 × 7), aunque no haya sesiones (RF-2, RF-5).
- La última celda es el domingo de la semana de hoy; las celdas posteriores a hoy dentro de esa semana existen y salen en nivel 0 salvo que haya una sesión futura, que sí se suma (RF-8, decisión 9 de la spec).
- Una sesión anterior a `startISO` o posterior a `endISO` no cae en ninguna celda (RF-9).
- No hay escrituras: solo se leen `sessions` (RF-11).
- Con el mismo `sessions` y el mismo `todayISO`, el resultado es idéntico (RNF-7).

## 5. Cómo se pinta en la interfaz (`index.html` + `app.js`)

### 5.1 Marcado (`index.html`) — cubre RF-1, RF-7

- Nueva sección `.heat-card` **entre** `.streak-card` y `.form-card` (RF-1), con:
  - un título (`h2`, p. ej. "Últimas 12 semanas");
  - un contenedor vacío `#heatmap`;
  - un párrafo `#heatmapDetail` (línea de detalle, `aria-live="polite"`);
  - una leyenda (RF-7) con las cinco muestras: "0 min", "1–29", "30–59", "60–119", "≥120", ordenadas de "menos" a "más".
- Cargar `logic.js` **antes** de `app.js`.

### 5.2 Pintado (`app.js`) — cubre RF-1, RF-6, RF-10, RF-11

- Nuevos elementos: `#heatmap` y `#heatmapDetail`.
- `renderHeatMap()`:
  1. `mapa ← buildHeatMap(sessions, getTodayISO())` (RF-2, RNF-7);
  2. por cada semana, un contenedor de columna; por cada celda, un elemento con clase `heat-cell level-N` y `data-date` (RF-4);
  3. `aria-label` = `formatDetail(date, minutes)` → "17/10/2026, 45 minutos" o "17/10/2026, sin estudio" (RNF-4);
  4. el **orden del DOM** es semana a semana y, dentro, lunes→domingo, para que coincida con el orden visual (RNF-4).
- `showHeatDetail(date, minutes)`: escribe `formatDetail(...)` en `#heatmapDetail` (RF-6).
- Eventos (delegados en `#heatmap`):
  - `pointerover` → mostrar detalle (RF-6);
  - `click` → mostrar/actualizar detalle (toque, RF-6);
  - `click` fuera del mapa → ocultar el detalle (RF-6).
- `updateHeatMap()` se llama en `init()` y al final de `handleSubmit()` (RF-10). No hay temporizadores: "hoy" se fija al cargar y al guardar.
- Accesibilidad: las celdas **no** son paradas de tabulador (no se añaden 84 paradas); el detalle se da por puntero, toque y nombre accesible (RNF-4).
- El mapa **no escribe** nada: la única escritura sigue siendo `saveSessions()` al guardar una sesión (RF-11).

## 6. Estilos (`styles.css`) — cubre RF-4, RF-7, RNF-1, RNF-4, RNF-8

- `.heatmap`: rejilla de 12 columnas × 7 filas con separación pequeña; ancho ajustado para no desbordar a 375 px.
- `.heat-cell`: cuadrado de lado fijo. `level-0` = papel/regla (vacío); `level-1..4` = misma tonalidad con intensidad creciente, usando la paleta del cuaderno (tinta azul-negra).
- La intensidad varía también en **luminosidad**, no solo en saturación, para que los cinco niveles se distingan en escala de grises y con colores forzados (RNF-4).
- `.heat-legend`: cinco muestras con su rango y contraste de texto ≥ 4.5:1 (RNF-4).
- `.heat-detail`: una sola línea; oculta cuando no hay detalle.
- A 375 px: las 12 columnas deben caber sin scroll horizontal (RNF-8).

## 7. Decisiones técnicas justificadas (y alternativa descartada)

1. **Módulo `logic.js` separado y puro.** Necesario para cumplir "lógica sin DOM ni `localStorage`, con 'hoy' como parámetro" (Constitución 3) y para poder cargarla desde los tests (Constitución 4). *Alternativa descartada:* dejar la lógica dentro de `app.js` con guardas; obliga a reestructurar `app.js` (hoy ejecuta DOM al cargar) y mezcla capas.
2. **Doble uso navegador/Node con exportación condicional** (`logic.js` exporta solo si existe el entorno de Node). *Alternativa descartada:* módulos ES (`type="module"`) porque con `file://` fallan por CORS y romperían el "doble clic" (Constitución 1).
3. **`buildHeatMap(sessions, todayISO)` devuelve datos; el pintado es aparte.** *Alternativa descartada:* calcular y pintar a la vez; no sería determinista ni testeable (RNF-7, RNF-6).
4. **El rango se resuelve con las 84 celdas, sin filtrar sesiones.** Una sesión fuera de la ventana no encuentra celda (RF-9). *Alternativa descartada:* filtrar las sesiones por rango antes; código extra sin cambio de resultado.
5. **Rejilla con `div` y `aria-label`, sin foco por celda.** Evita 84 paradas de tabulador y sigue dando el detalle a lectores de pantalla (RNF-4, decisión 9 de la spec). *Alternativa descartada:* navegación por teclado celda a celda (roving tabindex), fuera de alcance; y `<table>`, que no encaja con un calendario de color.
6. **Detalle por eventos delegados en el contenedor (`pointerover` + `click`).** *Alternativa descartada:* atributo `title` nativo por celda; no funciona en táctil ni es accesible ni estilizable.
7. **Colores por umbrales fijos de un mismo tono.** Predecible y comparable entre semanas (RF-4). *Alternativa descartada:* escala relativa al día de más minutos (descartada ya en la spec: cambia al añadir sesiones).
8. **Leyenda en HTML estático.** Sencillez (RNF-1); los rangos están fijados por la spec. *Alternativa descartada:* generar la leyenda desde `logic.js`; un único origen de verdad, pero añade una parte dinámica. *Riesgo:* si cambian los umbrales, hay que tocar la leyenda a mano.
9. **Sin temporizadores; "hoy" se reancla al cargar y al guardar.** (RF-10, decisión 11 de la spec). *Alternativa descartada:* temporizador para cruzar medianoche; más complejo y con tests frágiles.
10. **Reutilizar `formatDisplayDate` y la pluralización moviéndolas a `logic.js`.** *Alternativa descartada:* duplicarlas en `app.js` (dos fuentes de verdad y riesgo de que divergan).

## 8. Estrategia de tests con `node --test` — cubre RNF-6

- Runner: el de Node (`node --test`), sin instalar nada (Constitución 4). El archivo `logic.test.js` se detecta por el patrón `*.test.js`.
- Se carga `logic.js` directamente; los tests **no** tocan el DOM ni el almacenamiento.
- Determinismo: todos los casos pasan un `todayISO` fijo (p. ej. `2026-10-17`), nunca la fecha real.
- Se ejecuta `node --test` desde la raíz; **no se avanza con tests en rojo** (Constitución 4).

| Caso de prueba | RF que verifica |
|---|---|
| `classifyLevel` en los límites: 0, 1, 29, 30, 59, 60, 119, 120 y un valor muy alto | RF-4 |
| `buildHeatMap` devuelve 84 celdas en 12 semanas de 7 días | RF-2 |
| Primera celda = lunes 11 semanas antes; última = domingo de la semana de hoy | RF-2 |
| `todayISO` en lunes y en domingo; semana que cruza de mes y de año | RF-2, RF-9 |
| Varias sesiones el mismo día se suman (20 + 25 = 45) | RF-3 |
| Día sin sesiones y día con 0 minutos → nivel 0 | RF-5 |
| `formatMinutes` con 1 y con 45; `formatDetail` con y sin minutos | RF-6 |
| Sesión futura dentro de la semana → su celda refleja los minutos | RF-8 |
| Sesión anterior a `startISO` y posterior a `endISO` → no aparece | RF-9 |
| Fecha inválida (p. ej. `2026-13-45`) y minutos no enteros o < 1 → se ignoran sin error | RF-12 |
| Misma entrada (sesiones + `todayISO`) dos veces → mismo resultado | RNF-7 |
| Un día con hora 00:30 no se desplaza de día (sin UTC) | RNF-2 |

Comprobaciones que quedan en la **verificación manual** (no son lógica pura): que no se escriba en el almacenamiento al pintar (RF-11), la ubicación de la sección (RF-1), la leyenda (RF-7), el detalle al puntero/toque (RF-6), la actualización al guardar (RF-10), el rendimiento con ~5.000 sesiones (RNF-5) y el aspecto a 375 px (RNF-8).

## 9. Cumplimiento de la Constitución

- **P1 - Simplicidad**: sin dependencias ni build; `logic.js` es un `<script>` más y el proyecto sigue abriéndose con doble clic. (RNF-1)
- **P2 - La spec manda**: cada bloque indica los RF que cubre; no hay decisiones fuera de la spec (revisión 2, sin dudas abiertas).
- **P3 - Lógica aparte**: los cálculos van en `logic.js`, puros, sin DOM ni `localStorage`, recibiendo "hoy" como parámetro. (RNF-7)
- **P4 - Tests como puerta**: la lógica se prueba con `node --test`; primero los tests en verde, luego la interfaz. (RNF-6)
- **P5 - Datos sagrados**: el mapa es de solo lectura; el formato guardado no cambia y nunca se pierde una sesión. (RF-11)
- **P6 - Idioma**: identificadores en inglés; textos, leyenda y documentación en español. (RNF-3)

## 10. Orden de trabajo

1. `logic.js` (fechas + mapa) y `logic.test.js`; dejar `node --test` en verde.
2. `index.html`: sección del mapa entre `.streak-card` y `.form-card`; cargar `logic.js` antes de `app.js`.
3. `styles.css`: rejilla, niveles, leyenda, detalle y responsive.
4. `app.js`: pintado, detalle y actualización al guardar.
5. `AGENTS.md` (lista de archivos) y `MEMORY.md`.
6. Verificación manual con el MCP de Chrome DevTools.

## 11. Verificación manual (Chrome DevTools)

- Sin datos: 84 celdas en nivel 0 y leyenda visible (RF-2, RF-5, RF-7).
- Un día con ≥120 min → nivel máximo; detalle al pasar el puntero y al tocar (RF-4, RF-6).
- Sesión futura dentro de la semana → celda coloreada; una más allá del domingo → fuera (RF-8, RF-9).
- Guardar una sesión → el mapa se actualiza sin recargar, sin errores en consola (RF-10).
- El almacenamiento no se modifica al pintar (RF-11).
- 375 px: sin desbordamiento horizontal (RNF-8); con ~5.000 sesiones, el mapa responde con fluidez (RNF-5).
