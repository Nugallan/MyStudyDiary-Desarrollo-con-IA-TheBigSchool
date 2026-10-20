# Tasks 002 - Objetivo semanal de estudio

- Spec: `specs/002-objetivo-semanal/spec.md` (aprobada; borrador revisión 2)
- Plan: `specs/002-objetivo-semanal/plan.md`
- Orden: T1 → T2 → T3 → T4 → T5 → T6 → T7
- Regla: el implementer hace **una tarea por vez**; no se avanza con `node --test` en rojo (Constitución 4).

| Tarea | Qué hace | RF / RNF | Estado |
|---|---|---|---|
| T1 | Funciones puras del objetivo en `logic.js` (`getWeekEndISO`, `countWeekMinutes`, `buildWeeklyProgress`, `parseGoal`, `formatGoalText`, `formatGoalValueText`) + exports | RF-5…RF-11; RNF-2, RNF-3, RNF-5, RNF-7 | hecha |
| T2 | Tests nuevos en `logic.test.js` (rangos, progreso, cumplimiento, parseo, pluralización, determinismo y rendimiento 5.000 sesiones); `node --test` en verde | RF-6…RF-11; RNF-6, RNF-9 | hecha |
| T3 | Refactor de "Esta semana" en `app.js`: eliminar `getWeekRange()`/`countWeekMinutes()` y usar la función pura compartida | RF-6; RNF-7 | hecha |
| T4 | `index.html`: sección `.goal-card` entre `.streak-card` y `.heat-card`, con composición, barra, campo y botón | RF-5; RNF-1 | hecha |
| T5 | `app.js`: leer/validar/guardar el objetivo (`diario-estudio-goal`), `renderGoal()`, `handleGoalSubmit()` y actualización al guardar | RF-2, RF-3, RF-4, RF-10, RF-11, RF-12; RNF-4 | hecha |
| T6 | `styles.css`: tarjeta, barra y relleno amarillo, estado cumplido, contraste y 375 px | RF-7, RF-8; RNF-1, RNF-4, RNF-8 | hecha |
| T7 | `AGENTS.md` y `MEMORY.md` + verificación manual con Chrome DevTools | criterios §8; RNF-4, RNF-8 | hecha |

## Detalle

### T1 - Lógica pura del objetivo

- **Qué se hace**: ampliar `logic.js` con seis funciones puras (sin DOM, sin `localStorage`, sin
  reloj; "hoy" como parámetro en las que lo necesitan) y añadirlas a `module.exports`:
  - `getWeekEndISO(todayISO)` → domingo de la semana de "hoy" (o `null`), calculado con
    `getWeekStartISO()` + `addDays(..., 6)`.
  - `countWeekMinutes(sessions, todayISO)` → suma de minutos de la semana lunes–domingo (rango
    cerrado `>= inicio && <= fin`), reutilizando `minutesByDay()` (valida fecha y minutos ≥ 1).
  - `buildWeeklyProgress(sessions, goal, todayISO)` → `{ minutes, goal, ratio, cappedRatio, done, percent }`
    con `cappedRatio = min(1, ratio)`, `done = minutes >= goal`, `percent = min(100, Math.round(100 * minutes / goal))`;
    sin objetivo → `goal: null`, `cappedRatio: 0`, `done: false`, `percent: null`.
  - `parseGoal(rawValue)` → entero ≥ 1 o `null`, con la regex canónica estricta `^[1-9][0-9]*$` y
    `<= Number.MAX_SAFE_INTEGER`; rechaza `""`, `" 300 "`, `"300.0"`, `"1e3"`, `"0300"`, `"0"`, `"-5"`,
    `"abc"` y cualquier valor no `string`.
  - `formatGoalText(minutes, goal)` → `"X de Y minutos"` o `"X minutos · Sin objetivo · Fija uno"`
    (pluraliza cada cifra con `formatMinutes`).
  - `formatGoalValueText(progress)` → `"X de Y minutos, N %"` con los minutos reales.
- **Archivos**: `logic.js` (solo).
- **Hecho cuando**: las seis funciones existen, son puras, están exportadas y `node --test` sigue en
  verde con los 20 tests existentes (aún sin tests nuevos: T2 los añade).

### T2 - Tests de la lógica pura

- **Qué se hace**: añadir a `logic.test.js` los casos de la tabla del apartado 9 del plan:
  - `getWeekEndISO` con hoy lunes, sábado y domingo, semana que cruza de año (`2027-01-01`) y
    `todayISO` inválido → `null`;
  - `countWeekMinutes`: rango lunes–domingo, sesión futura de la misma semana que cuenta, sesiones
    de otras semanas y con fecha/minutos inválidos que no cuentan, mismo total con hoy lunes y hoy
    domingo;
  - `buildWeeklyProgress`: sin objetivo; sin sesiones; minutos < objetivo; minutos == objetivo
    (umbral inclusivo); 10.000 de 300 (barra limitada, minutos reales, `percent` 100); redondeo del
    `percent` (200/300 → 67);
  - `formatGoalText`: "1 de 300 minutos", "45 de 1 minuto", "350 de 300 minutos" y sin objetivo;
  - `formatGoalValueText`: "120 de 300 minutos, 40 %" y con objetivo de 1 ("1 de 1 minuto, 100 %" —
    cierra la observación del `aria-valuetext`) y "350 de 300 minutos, 100 %";
  - `parseGoal`: acepta `"300"`, `"1"`, `"9007199254740991"`; rechaza las formas corruptas de §6 y
    el valor mayor que `MAX_SAFE_INTEGER`; rechaza valores no cadena; ida y vuelta `parseGoal(String(300)) === 300`;
  - determinismo (`deepEqual` de dos llamadas iguales) y rendimiento: `countWeekMinutes` sobre 5.000
    sesiones en < 100 ms con `performance.now()`.
- **Archivos**: `logic.test.js`.
- **Hecho cuando**: `node --test` en verde con todos los tests nuevos y los 20 anteriores (sin
  ninguno en rojo).

### T3 - Refactor de "Esta semana"

- **Qué se hace**: en `app.js`, **eliminar** `getWeekRange()` y `countWeekMinutes()` (reloj propio y
  sin validar minutos) y reescribir `updateWeekTotal()` para usar `countWeekMinutes(sessions, getTodayISO())`
  de `logic.js` y `formatMinutes(total)` para el texto. No cambian sus llamadas en `init()` ni en
  `handleSubmit()`.
- **Archivos**: `app.js`.
- **Hecho cuando**: "Esta semana" muestra la misma cifra que sale de la función pura, `app.js` ya no
  contiene aritmética de la semana y `node --test` sigue en verde.

### T4 - Marcado de la tarjeta

- **Qué se hace**: añadir `.goal-card` **entre** `.streak-card` y `.heat-card` en `index.html`:
  `<h2 id="goalTitle">Objetivo semanal</h2>` (sección con `aria-labelledby="goalTitle"`),
  `<p id="goalProgress" aria-live="polite">`, la barra (`#goalBar` con relleno `#goalFill`),
  `<p id="goalDone">¡Objetivo cumplido!</p>` (con clase `hidden` de partida) y el formulario
  `#goalForm` (`novalidate`) con `<label for="goalInput">Minutos por semana</label>`,
  `<input type="number" id="goalInput" min="1" step="1" inputmode="numeric" required>` y
  `<button type="submit" class="btn-save">Guardar objetivo</button>`. "Sin objetivo · Fija uno" es
  texto, nunca enlace ni botón (RF-9).
- **Archivos**: `index.html`.
- **Hecho cuando**: la sección existe en el orden correcto con esos ids y textos, y la página sigue
  abriéndose con doble clic (sin scripts nuevos).

### T5 - Interfaz del objetivo

- **Qué se hace**: en `app.js`, añadir `GOAL_STORAGE_KEY = "diario-estudio-goal"` y `let goal = null;`,
  los elementos por id, y:
  - `loadGoal()`: lee la clave cruda y delega en `parseGoal()`; en `catch` (o sin clave/no canónico)
    devuelve `null` con `console.warn`, sin borrar ni sobrescribir lo guardado y sin `console.error`;
  - `handleGoalSubmit(event)`: `preventDefault`, valida `Number(...)` entero ≥ 1 y `Number.isSafeInteger`
    (si falla, `goalInput.focus()` y salir), guarda `String(goal)` en la clave, actualiza
    `renderGoal()` + `updateWeekTotal()` al instante y devuelve el foco a `goalInput`; nunca toca
    `sessions` ni `diario-estudio-sessions`;
  - `renderGoal()`: `buildWeeklyProgress(sessions, goal, getTodayISO())`; escribe `formatGoalText(...)`
    en `#goalProgress`; con objetivo pone el campo pre-rellenado (`String(goal)`, RF-3), el ancho de
    `#goalFill` a `cappedRatio * 100 %` y en `#goalBar` `role="progressbar"`, `aria-labelledby="goalTitle"`,
    `aria-valuemin="0"`, `aria-valuemax`, `aria-valuenow = min(minutes, goal)` y
    `aria-valuetext = formatGoalValueText(...)`; sin objetivo deja el campo **vacío** (RF-2), quita
    `role`/`aria-*` de `#goalBar`, marca `#goalFill` `aria-hidden="true"` y el relleno a 0 %;
    y muestra/oculta `#goalDone` con `classList.toggle("hidden", !progress.done)`.
  - `init()`: `goal = loadGoal();` y `renderGoal()`; `handleSubmit()` (sesión): `renderGoal()` al
    final para refrescar progreso y barra (RF-12); `goalForm.addEventListener("submit", handleGoalSubmit)`.
- **Archivos**: `app.js`.
- **Hecho cuando**: en el navegador se crea/edita el objetivo sin recargar, el progreso y los
  atributos accesibles se actualizan, el campo queda vacío sin objetivo y pre-rellenado con objetivo,
  y la consola no muestra errores.

### T6 - Estilos

- **Qué se hace**: en `styles.css`, añadir `.goal-card` a la regla de secciones con renglón superior;
  estilar la composición (tabular-nums), la pista `.goal-bar` (contorno ≥ 3:1 sobre `--paper`) y el
  relleno `.goal-fill` con `var(--highlight)` amarillo; el texto `.goal-done` (con `.hidden`
  reutilizando el patrón existente); ajustar color de placeholder/borde del campo si no llega a
  4.5:1/3:1 (solo color, no estructura); apilar campo y botón a 375 px si no caben; y en
  `forced-colors` hacer que la barra siga distinguiéndose.
- **Archivos**: `styles.css`.
- **Hecho cuando**: la tarjeta respeta el orden de RF-5, la barra se ve llena con el subrayador al
  cumplir, no hay desbordamiento a 375 px y los contrastes medidos cumplen los umbrales.

### T7 - Documentación y verificación manual

- **Qué se hace**:
  - `AGENTS.md`: documentar la tarjeta de objetivo, la clave `diario-estudio-goal` y que "Esta semana"
    ya no calcula el rango por su cuenta sino que usa la función pura compartida de `logic.js`,
    incluyendo la nueva regla en "Comportamiento clave" y en "Notas de arquitectura".
  - `MEMORY.md`: estado (v1.5 objetivo semanal), decisiones (fuente única del cálculo de la semana,
    texto canónico del objetivo, barra limitada al 100 % con minutos reales, sin borrado) y
    aprendizajes/errores a evitar.
  - Verificación manual con el MCP de Chrome DevTools (apartado 13 del plan): estados sin objetivo,
    parcial y cumplido; snapshot de accesibilidad de los tres (rol/`aria-valuetext`/ausencia de
    `progressbar`); recorrido por teclado (campo y botón, foco de vuelta tras guardar) y "Fija uno"
    fuera del orden de tabulación; edición del objetivo con recálculo y persistencia al recargar;
    valor corrupto en `diario-estudio-goal` + recarga; comparación "Esta semana" vs "X de Y minutos";
    consola limpia; 375 px sin desbordes y contrastes medidos.
  - **Comprobar que `diario-estudio-sessions` no cambia de formato ni de contenido** al crear/editar
    el objetivo (RF-10, Constitución 5), y que `diario-estudio-goal` queda en forma canónica tras guardar.
- **Archivos**: `AGENTS.md`, `MEMORY.md` (y verificación del resto).
- **Hecho cuando**: `AGENTS.md` y `MEMORY.md` reflejan el cambio, la verificación manual pasa sin
  errores en consola, la accesibilidad de los tres estados es correcta y `diario-estudio-sessions`
  sigue intacta.
