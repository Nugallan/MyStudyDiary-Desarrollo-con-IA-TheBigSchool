# Plan 002 - Objetivo semanal de estudio

- Estado: listo para revisión
- Fecha: 2026-10-20
- Spec: `specs/002-objetivo-semanal/spec.md` (aprobada; borrador revisión 2, veredicto QA APROBADO)
- Constitución: `docs/constitution.md`
- Plan de referencia (formato): `specs/001-heat-map/plan.md`

## 1. Enfoque

Añadir una tarjeta "Objetivo semanal" entre la tarjeta de estadísticas y el mapa de calor, con:
la composición de minutos "X de Y minutos", una barra de progreso, el campo "Minutos por semana"
y el botón "Guardar objetivo". El progreso se calcula **una sola vez** con una función pura nueva
de `logic.js` que recibe "hoy" y reutiliza `getWeekStartISO()`; esa misma función sustituye el
cálculo actual de "Esta semana" (`getWeekRange()`/`countWeekMinutes()` en `app.js`), de modo que
las dos cifras coinciden por construcción. El objetivo se persiste en una clave nueva
`diario-estudio-goal` como cadena canónica de dígitos y se valida con otra función pura al leerlo.
`app.js` solo lee/escribe `localStorage`, pinta la tarjeta y llama a `logic.js`. Sin dependencias,
sin build y sin tocar `diario-estudio-sessions`.

## 2. Mapa de cobertura

Cada parte de este plan cubre estos requisitos:

| Bloque del plan | RF / RNF que cubre |
|---|---|
| `logic.js` (minutos de la semana + progreso) | RF-6, RF-7, RF-8, RF-9, RNF-2, RNF-5, RNF-7, RNF-9 |
| `logic.js` (parseo/validación del objetivo guardado) | RF-10, RF-11, RNF-7 |
| `logic.js` (formato del texto de progreso/cumplimiento y porcentaje) | RF-5, RF-8, RF-9, RNF-3, RNF-4 |
| `app.js` (refactor de "Esta semana") | RF-6, RNF-7 |
| `index.html` (sección nueva + orden) | RF-5, RNF-1 |
| `app.js` (lectura/escritura del objetivo, pintado y eventos) | RF-2, RF-3, RF-4, RF-10, RF-11, RF-12, RNF-4 |
| `styles.css` | RF-5, RF-7, RF-8, RNF-1, RNF-4, RNF-8 |
| `logic.test.js` | RNF-6, RNF-9 (y verificación de RF-6…RF-11) |
| Verificación manual (navegador) | RF-2, RF-3, RF-4, RF-12, RNF-4, RNF-8 |
| `AGENTS.md` / `MEMORY.md` | criterios de finalización §8 |

## 3. Archivos: qué cambia y qué responsabilidad tiene cada uno

| Archivo | Acción | Responsabilidad | Cubre |
|---|---|---|---|
| `logic.js` | **Se modifica** | Añadir funciones **puras** de minutos de la semana, progreso y parseo del objetivo. Sigue sin DOM, sin `localStorage` y sin reloj (recibe "hoy"). | RF-6, RF-7, RF-8, RF-9, RF-10, RF-11, RNF-2, RNF-5, RNF-7, RNF-9 |
| `logic.test.js` | **Se modifica** | Tests nuevos de la lógica pura; se mantienen los 20 existentes en verde. | RNF-6, RNF-9 |
| `index.html` | **Se modifica** | Nueva sección `.goal-card` **entre** `.streak-card` y `.heat-card` con la barra, la composición, el campo y el botón. | RF-5, RNF-1 |
| `app.js` | **Se modifica** | Sustituir `getWeekRange()`/`countWeekMinutes()` por la función pura; leer/guardar el objetivo; pintar la tarjeta; eventos y actualización al guardar. | RF-2, RF-3, RF-4, RF-6, RF-10, RF-11, RF-12, RNF-4, RNF-7 |
| `styles.css` | **Se modifica** | Aspecto de la tarjeta, barra y su relleno (subrayador amarillo), estado cumplido, y responsive a 375 px. | RF-7, RF-8, RNF-1, RNF-4, RNF-8 |
| `AGENTS.md` | **Se modifica** | Documentar la tarjeta y que "Esta semana" ya usa la función pura compartida; clave nueva de `localStorage`. | criterios §8 |
| `MEMORY.md` | **Se modifica** | Estado y decisiones al terminar. | — |

Separación de capas (Constitución 3), sin cambios estructurales:

```
index.html
  <script src="logic.js">   ← puro (cálculos del progreso y parseo del objetivo)
  <script src="app.js">     ← interfaz (DOM + localStorage)

logic.test.js  →  carga logic.js  →  node --test
```

> No se crean archivos nuevos: la spec encaja en la estructura existente (spec §9, "sin borrado del
> objetivo" y tarjeta propia). `logic.js` sigue siendo el único sitio con cálculos.

## 4. Funciones puras nuevas en `logic.js`

Identificadores en inglés, textos en español (RNF-3). Ninguna consulta el reloj; las que dependen
del tiempo reciben `todayISO`. Firmas exactas:

| Función | Entrada | "hoy" | Salida | Cubre |
|---|---|---|---|---|
| `getWeekEndISO(todayISO)` | texto `AAAA-MM-DD` | **sí** | domingo de esa semana (`AAAA-MM-DD`) o `null` | RF-6 |
| `countWeekMinutes(sessions, todayISO)` | sesiones, `todayISO` | **sí** | minutos enteros ≥ 0 | RF-6, RNF-9 |
| `buildWeeklyProgress(sessions, goal, todayISO)` | sesiones, `goal` (entero ≥ 1) o `null`, `todayISO` | **sí** | `{ minutes, goal, ratio, cappedRatio, done, percent }` | RF-7, RF-8, RF-9 |
| `parseGoal(rawValue)` | valor leído de `localStorage` (cadena o ausencia) | no | entero ≥ 1 o `null` | RF-10, RF-11 |
| `formatGoalText(minutes, goal)` | enteros | no | "X de Y minutos" / "X minutos · Sin objetivo · Fija uno" | RF-5, RF-8, RF-9 |
| `formatGoalValueText(progress)` | objeto de `buildWeeklyProgress` | no | "X de Y minutos, N %" | RNF-4 |

Detalles y decisiones de firma:

- **`getWeekEndISO(todayISO)`**: `toISODate(addDays(parseISODate(getWeekStartISO(todayISO)), 6))`;
  `null` si `todayISO` no es válido (coherente con `getWeekStartISO()`). Reutiliza la función
  existente para **no repetir la aritmética del lunes** (RF-6, decisión §9 de la spec).
- **`countWeekMinutes(sessions, todayISO)`**: reutiliza `minutesByDay(sessions)` (que ya valida
  fecha local `AAAA-MM-DD` y minutos enteros ≥ 1, misma regla que el RF-12 de la spec 001) y suma
  los días `>= startISO && <= endISO` (rango cerrado inclusivo, lunes→domingo → cubre la precisión
  del "rango semiabierto" de la observación menor: aquí es **cerrado en ambos extremos**, y así se
  documenta en el test). Es la **fuente única** que comparten "Esta semana" y el progreso (RF-6).
  Ignora sesiones con fecha inválida o minutos no válidos (RF-6, condición). Es la función que debe
  cumplir RNF-9.
- **`buildWeeklyProgress(sessions, goal, todayISO)`**: `minutes = countWeekMinutes(...)`.
  - `goal === null` → `{ minutes, goal: null, ratio: null, cappedRatio: 0, done: false, percent: null }`
    (estado sin objetivo, RF-9: barra vacía, sin porcentaje ni cifra inventada).
  - con objetivo → `ratio = minutes / goal`; `cappedRatio = Math.min(1, ratio)` (RF-7, nunca > 100 %);
    `done = minutes >= goal` (umbral inclusivo ≥, RF-8); `percent = Math.min(100, Math.round(100 * minutes / goal))`.
  - **No** decide textos ni DOM: devuelve datos y `app.js` pinta.
- **`parseGoal(rawValue)`**: valida con la regla canónica estricta `GOAL_PATTERN = /^[1-9][0-9]*$/`
  y comprueba que el entero resultante sea ≤ `Number.MAX_SAFE_INTEGER`; devuelve el entero o `null`.
  Rechaza (entre otros) `""`, `" 300 "`, `"300.0"`, `"1e3"`, `"0300"` (ceros a la izquierda),
  `"0"`, `"-5"`, `"abc"`, y cualquier valor que no sea `string` (`true`, `null`, `{}`, `300`), así
  como un entero > `Number.MAX_SAFE_INTEGER` (RF-11, §6 de la spec). **No toca `localStorage`**:
  `app.js` lee la clave cruda y se la pasa.
- **`formatGoalText(minutes, goal)`**: con objetivo → `"${formatMinutes(minutes)} de ${formatMinutes(goal)}"`
  (reutiliza `formatMinutes` para la pluralización por cifra, RF-8: "1 de 300 minutos", "45 de 1 minuto");
  sin objetivo → `"${formatMinutes(minutes)} · Sin objetivo · Fija uno"` (RF-9).
- **`formatGoalValueText(progress)`**: con objetivo → `"${formatMinutes(minutes)} de ${formatMinutes(goal)}, ${percent} %"`,
  con los **minutos reales** aunque `percent` esté a 100 (RF-8, RNF-4). Sin objetivo no se llama
  (no se expone `progressbar`, RNF-4).

### 4.1 Pseudocódigo

```
FUNCIÓN getWeekEndISO(todayISO):
    inicio ← getWeekStartISO(todayISO)
    SI inicio es "nada" ENTONCES DEVOLVER "nada"
    DEVOLVER toISODate(addDays(parseISODate(inicio), 6))      # domingo inclusivo

FUNCIÓN countWeekMinutes(sessions, todayISO):
    inicio ← getWeekStartISO(todayISO)
    SI inicio es "nada" ENTONCES DEVOLVER 0
    fin ← getWeekEndISO(todayISO)
    totales ← minutesByDay(sessions)                          # valida fecha y minutos
    total ← 0
    PARA CADA (dia, minutos) EN totales:
        SI dia >= inicio Y dia <= fin ENTONCES total ← total + minutos
    DEVOLVER total

FUNCIÓN buildWeeklyProgress(sessions, goal, todayISO):
    minutos ← countWeekMinutes(sessions, todayISO)
    SI goal es "nada" ENTONCES
        DEVOLVER { minutes, goal: null, ratio: null, cappedRatio: 0, done: false, percent: null }
    razon ← minutos / goal
    DEVOLVER {
        minutes,
        goal,
        ratio: razon,
        cappedRatio: min(1, razon),                           # barra limitada al 100 %
        done: minutos >= goal,                                # umbral inclusivo
        percent: min(100, redondear(100 * minutos / goal))
    }

FUNCIÓN parseGoal(rawValue):
    SI typeof rawValue NO ES "string" ENTONCES DEVOLVER "nada"
    SI NO cumple /^[1-9][0-9]*$/ ENTONCES DEVOLVER "nada"     # canónico estricto
    entero ← Number(rawValue)
    SI entero > Number.MAX_SAFE_INTEGER ENTONCES DEVOLVER "nada"
    DEVOLVER entero
```

Propiedades:

- Determinismo: mismo `sessions`, `goal` y `todayISO` → mismo resultado (RNF-5).
- El rango de la semana se calcula **una sola vez** por función y siempre vía `getWeekStartISO()`
  (no hay aritmética de lunes duplicada, RNF-7).
- Sin escrituras: solo se leen `sessions` y `goal` (Constitución 5).

## 5. Refactor de "Esta semana" (`app.js`) — cubre RF-6, RNF-7

- **Se eliminan** `getWeekRange()` y `countWeekMinutes()` de `app.js` (líneas 192–209, con reloj
  propio y sin validar minutos).
- `updateWeekTotal()` pasa a:
  ```
  function updateWeekTotal() {
    const total = countWeekMinutes(sessions, getTodayISO());   // función pura de logic.js
    weekMinutesEl.textContent = formatMinutes(total);          // pluralización compartida
  }
  ```
- `handleSubmit()` ya llama a `updateWeekTotal()`; no cambia su flujo. "Hoy" se reancla solo al
  cargar (`init()`) y al guardar (RF-12), como el mapa de calor; sin temporizadores.
- Efecto colateral querido: al usar `minutesByDay`, "Esta semana" ahora **ignora** sesiones con
  fecha o minutos inválidos (antes sumaba `Number(minutes) || 0` sin validar); es más estricto y
  queda cubierto por tests.
- Criterio (RF-6): la tarjeta de estadísticas y la de objetivo obtienen los minutos de **la misma
  llamada** `countWeekMinutes(...)`, así que coinciden por construcción.

## 6. Interfaz y `localStorage` (`index.html` + `app.js`)

### 6.1 Marcado (`index.html`) — cubre RF-5, RF-9

Nueva sección `.goal-card` **entre** `.streak-card` y `.heat-card`, con:

- `<h2 id="goalTitle">Objetivo semanal</h2>`; la sección lleva `aria-labelledby="goalTitle"` (RNF-4).
- La composición de minutos: `<p id="goalProgress">` (p. ej. "120 de 300 minutos") con
  `aria-live="polite"` (RNF-4, opcional no bloqueante).
- La barra: un contenedor `#goalBar` con un relleno interior `#goalFill`:
  - con objetivo, `app.js` pone en `#goalBar` `role="progressbar"`, `aria-labelledby="goalTitle"`,
    `aria-valuemin="0"`, `aria-valuemax=<goal>`, `aria-valuenow=<min(minutes, goal)>` y
    `aria-valuetext=<formatGoalValueText(...)>`; el relleno `#goalFill` es decorativo.
  - sin objetivo, `app.js` **quita** `role`/`aria-*` de `#goalBar`, marca `#goalFill` `aria-hidden="true"`
    y deja el relleno a 0 % (RF-9, RNF-4).
- El texto de cumplimiento: `<p id="goalDone">¡Objetivo cumplido!</p>`, oculto salvo cuando
  `progress.done` (RF-8).
- El formulario del objetivo: `<form id="goalForm" novalidate>` con
  `<label for="goalInput">Minutos por semana</label>`,
  `<input type="number" id="goalInput" min="1" step="1" inputmode="numeric" required>` y
  `<button type="submit" class="btn-save">Guardar objetivo</button>` (RF-4). El "Sin objetivo · Fija uno"
  del RF-9 es **texto** dentro de `#goalProgress`, no un enlace ni un botón (RF-9).
- No se añaden scripts nuevos: `logic.js` ya se carga antes de `app.js`.

### 6.2 Pintado y eventos (`app.js`) — cubre RF-2, RF-3, RF-4, RF-10, RF-11, RF-12

Nuevos elementos por id: `goalForm`, `goalInput`, `goalProgress`, `goalBar`, `goalFill`, `goalDone`.
Nueva constante `GOAL_STORAGE_KEY = "diario-estudio-goal"`. Estado en memoria: `let goal = null;`

- **Leer** — `loadGoal()`:
  ```
  function loadGoal() {
    try {
      return parseGoal(localStorage.getItem(GOAL_STORAGE_KEY));   // pura: valida y parsea
    } catch (error) {
      console.warn("No se ha podido cargar el objetivo guardado", error);
      return null;                                                // tratado como sin objetivo
    }
  }
  ```
  Igual que `loadSessions()`: si la clave no existe, la lectura falla o el valor no es canónico,
  se trata como "sin objetivo" (RF-11) **sin borrar ni sobrescribir** lo guardado.
- **Guardar** — `handleGoalSubmit(event)`:
  1. `event.preventDefault();`
  2. leer `goalInput.value` y validar con la regla del RF-4: `Number(...)` entero ≥ 1 y
     `Number.isSafeInteger`; si falla, no guardar y `goalInput.focus()` (RF-4).
  3. válido → `goal = <entero>; localStorage.setItem(GOAL_STORAGE_KEY, String(goal));` (forma
     canónica, RF-10: normaliza `1e3` del control numérico a `"1000"`).
  4. `renderGoal()` + `updateWeekTotal()` (el progreso se recalcula al instante, RF-12), luego
     `goalInput.focus()` para una nueva edición (RF-4).
  5. el formulario del objetivo es independiente del de sesiones: guardar objetivo **no** toca
     `sessions`, `diario-estudio-sessions`, racha, mes ni lista.
- **Pintar** — `renderGoal()`:
  ```
  function renderGoal() {
    const todayISO = getTodayISO();
    const progress = buildWeeklyProgress(sessions, goal, todayISO);
    goalProgressEl.textContent = formatGoalText(progress.minutes, progress.goal);

    if (progress.goal === null) {
      resetGoalBar();                       // quita role/aria-*; relleno 0 %; aria-hidden
    } else {
      setGoalBarAccessible(progress);       // role="progressbar" + aria-valuemin/max/now/text
      goalFillEl.style.width = `${progress.cappedRatio * 100}%`;
    }
    goalDoneEl.classList.toggle("hidden", !progress.done);   // "¡Objetivo cumplido!"
  }
  ```
  - Sin objetivo: `goalInput.value = ""` (RF-2, campo vacío, nunca pre-rellenado).
  - Con objetivo: `goalInput.value = String(progress.goal)` (RF-3, pre-rellenado tanto al cargar
    como tras guardar). El pre-rellenado **solo** ocurre en el estado "ya hay objetivo".
  - Los atributos accesibles se actualizan al guardar, igual que el texto (RF-12, RNF-4).
- **Orden de llamadas**:
  - `init()`: `goal = loadGoal();` tras `sessions = loadSessions();` y llama a `renderGoal()`
    (que además deja el campo vacío o pre-rellenado) y a `updateWeekTotal()`.
  - `handleSubmit()` (sesión): al final, añade `renderGoal()` para refrescar progreso y barra tras
    guardar una sesión (RF-12); no toca `goalInput`.
  - se elimina la doble fuente: `updateWeekTotal()` ya usa la función pura (apartado 5).
- **Evento**: `goalForm.addEventListener("submit", handleGoalSubmit);`

### 6.3 Errores (RF-11)

- Clave ausente, lectura que lanza o valor no canónico → "sin objetivo", con `console.warn`
  admitido y **sin** `console.error` ni excepción sin capturar (mismo patrón que `loadSessions`).
- `localStorage` no disponible (p. ej. modo restringido): la app sigue funcionando en la sesión
  actual; el objetivo no persiste y no hay errores en consola (RF-11, §6 de la spec).
- El valor corrupto **no se borra** al leerlo: solo se sobrescribe cuando la persona guarda un
  objetivo válido (RF-2/RF-3, §6 de la spec).

## 7. Estilos (`styles.css`) — cubre RF-7, RF-8, RNF-1, RNF-4, RNF-8

- `.goal-card`: mismo patrón de renglón/sección que `.streak-card`, `.heat-card`, `.form-card`,
  `.list-card` (añadirla a esa regla compartida). Separación interna y orden de los bloques (RF-5).
- `.goal-progress`: cifra de la composición en serif/mono con `font-variant-numeric: tabular-nums`,
  coherente con el resto.
- `.goal-bar`: **pista** de la barra, con altura fija y contorno `1px solid var(--rule-strong)`
  o `var(--ink-soft)`; el contorno debe verse ≥ 3:1 frente al fondo de la tarjeta
  (`--paper #f7f8f3`) para cumplir WCAG 1.4.11 (RNF-4). Si el color actual no llega, se ajusta aquí.
- `.goal-fill`: relleno con el **subrayador amarillo** de la identidad (`var(--highlight) #f6dd6a`),
  ancho en `%` fijado por JS, `transition: width` suave y sin animaciones extra (RF-8). Con
  `prefers-reduced-motion: reduce` ya se anula la transición (regla global existente).
- `.goal-done`: texto "¡Objetivo cumplido!" con el amarillo de fondo (mismo gesto que el subrayador
  de la racha) o color de tinta que garantice 4.5:1 (RNF-4). `.goal-done.hidden { display: none; }`
  reutilizando el patrón de `.empty-state.hidden`.
- **Contraste** (RNF-4): el título, la composición, "Sin objetivo", "Fija uno", "¡Objetivo cumplido!",
  el rótulo, el texto del botón y el valor del campo deben llegar a 4.5:1. Si el `input::placeholder`
  actual (`#6e8087`) no alcanza sobre `--paper` o el borde del campo no se distingue, se ajusta el
  **color** en esta implementación (no la estructura), como permite la spec §9.
- **Responsive (RNF-8)**: a 375 px, si el campo y el botón no caben en una línea, se apilan
  (`flex-wrap` o `flex-direction: column` en el bloque del formulario del objetivo); sin
  desbordamiento horizontal.
- **Colores forzados (RNF-4)**: en `@media (forced-colors: active)`, la barra debe seguir
  distinguiéndose (p. ej. `#goalBar` con borde `CanvasText` y `#goalFill` con
  `background: Highlight`/`CanvasText`), ya que ahí se pierden los fondos.
- La barra **no** es texto: queda fuera del 4.5:1, pero su estado no depende del color porque hay
  texto equivalente (la composición y "¡Objetivo cumplido!").

## 8. Decisiones técnicas justificadas (y alternativa descartada)

1. **Fuente única del cálculo de la semana en `logic.js`.** Un solo `countWeekMinutes(sessions, todayISO)`
   compartido por "Esta semana" y el progreso (RF-6). *Alternativa descartada:* dejar
   `getWeekRange()`/`countWeekMinutes()` en `app.js` y comparar cifras con un test manual; no
   garantiza que coincidan por construcción ni las cubre `node --test` (decisión §9 de la spec, ya
   descartada).
2. **Reutilizar `getWeekStartISO()` en vez de repetir el `(getDay()+6)%7`.** *Alternativa descartada:*
   duplicar la aritmética del lunes; dos fuentes de verdad (RF-6, RNF-7).
3. **`getWeekEndISO(todayISO)` como función aparte y minúscula.** Deja el rango de la semana en un
   único punto y es la función que devuelve "el lunes más seis". *Alternativa descartada:*
   devolver `{ startISO, endISO }` desde `countWeekMinutes`; complica la firma para lo que solo
   necesita internamente.
4. **`buildWeeklyProgress` devuelve datos (`ratio`, `cappedRatio`, `done`, `percent`); el pintado
   es aparte.** Determinista y testeable (RNF-5, RNF-7). *Alternativa descartada:* calcular y pintar
   a la vez; no testeable.
5. **Barra con `role="progressbar"` solo cuando hay objetivo.** Sin máximo real que anunciar, el
   relleno es decorativo y el estado lo dice el texto visible (RNF-4, decisión §9). *Alternativa
   descartada:* exponer siempre `progressbar` con `aria-valuemax` inventado; contradice RF-9.
6. **`parseGoal` con regex canónica estricta y sin trim.** Regla única y comprobable, idéntica al
   formato que se escribe (RF-10/RF-11). *Alternativa descartada:* `Number()` + `trim()` (toleraría
   `" 300 "`, `"300.0"`, `"1e3"`), que la spec marca explícitamente como inválidos.
7. **El formulario es tolerante (normaliza `1e3` → `"1000"`) y la lectura es estricta.** Los dos
   caminos quedan separados: el primero es de la persona, el segundo es defensivo (decisión §9).
   *Alternativa descartada:* validar el campo con la misma regex que el almacén; rechazaría lo que
   el propio control numérico produce.
8. **Las cifras visibles pasan por `formatMinutes` (pluralización por cifra).** "1 de 300 minutos",
   "45 de 1 minuto" (RF-8). *Alternativa descartada:* construir la cadena a mano en `app.js`;
   divergiría de la lista y del mapa.
9. **Los minutos mostrados son reales aunque la barra se limite al 100 %** (`aria-valuenow` limitado
   al objetivo, `aria-valuetext` con los minutos reales). RF-7/RF-8 y RNF-4.
10. **Sin temporizadores; "hoy" se reancla al cargar y al guardar (sesión u objetivo).** Como el
    mapa de calor (RF-12, decisión §9). *Alternativa descartada:* temporizador de medianoche; más
    complejo y con tests frágiles.
11. **Las celdas de la barra son `div` con `role="progressbar"` en el contenedor.** Una sola parada
    accesible (el contenedor) y un solo `aria-valuetext`. *Alternativa descartada:* `meter`/`progress`
    nativos; el control nativo no permite fijar `aria-valuetext` español ni el estilo del subrayador.
12. **El objetivo no se borra en esta versión** y `diario-estudio-sessions` no se toca (decisión del
    usuario, Constitución 5).

## 9. Estrategia de tests con `node --test` — cubre RNF-6, RNF-9

Runner de Node, sin instalar nada (Constitución 4). Se amplía `logic.test.js`; no toca DOM ni
almacenamiento. Todos los casos pasan un `todayISO` fijo (p. ej. `2026-10-17`) y los 20 tests
existentes siguen en verde.

| Caso de prueba | RF / RNF |
|---|---|
| `getWeekEndISO`: hoy sábado/`2026-10-17` → `2026-10-18`; hoy lunes `2026-10-12` → `2026-10-18`; hoy domingo `2026-10-18` → `2026-10-18` | RF-6 |
| `getWeekEndISO`/`getWeekStartISO`: semana que cruza de año (p. ej. `todayISO="2027-01-01"` → lunes `2026-12-28`, domingo `2027-01-03`) | RF-6 |
| `getWeekEndISO("2026-13-45")` → `null` | RF-6 |
| `countWeekMinutes`: suma solo las sesiones del rango lunes–domingo; una del viernes anterior y otra del lunes siguiente no cuentan | RF-6 |
| `countWeekMinutes`: sesión **futura dentro de la misma semana** cuenta (rango cerrado `>= inicio && <= fin`) | RF-6 |
| `countWeekMinutes`: fecha inválida (`2026-13-45`), minutos `0`, `-5`, `30.5`, `"30"` → no cuentan | RF-6 |
| `countWeekMinutes` con hoy lunes `2026-10-12` y hoy domingo `2026-10-18` → mismo total para las mismas sesiones | RF-6 |
| `buildWeeklyProgress`: sin objetivo → `goal null`, `cappedRatio 0`, `done false`, `percent null` | RF-9 |
| `buildWeeklyProgress`: sin sesiones y con objetivo → `minutes 0`, barra vacía, `done false` | RF-7 |
| `buildWeeklyProgress`: minutos < objetivo → `cappedRatio = minutes/goal`, `done false` | RF-7 |
| `buildWeeklyProgress`: minutos == objetivo → `done true` (umbral inclusivo), `percent 100` | RF-8 |
| `buildWeeklyProgress`: 10.000 de 300 → `cappedRatio 1` (nunca > 100 %), `done true`, `percent 100`, `minutes 10000` (minutos reales) | RF-7, RF-8 |
| `buildWeeklyProgress`: `percent` redondeado (`Math.round`, p. ej. 200/300 → 67) y limitado a 100 | RNF-4 |
| `formatGoalText`: "1 de 300 minutos", "45 de 1 minuto", "350 de 300 minutos", y sin objetivo "120 minutos · Sin objetivo · Fija uno" | RF-5, RF-8, RF-9 |
| `formatGoalValueText`: "120 de 300 minutos, 40 %" y "350 de 300 minutos, 100 %" (real, no recortado) | RNF-4 |
| `parseGoal`: acepta `"300"`, `"1"` y `"9007199254740991"` (`MAX_SAFE_INTEGER`) | RF-10, RF-11 |
| `parseGoal`: rechaza `""`, `" 300 "`, `"300.0"`, `"1e3"`, `"0300"`, `"0"`, `"-5"`, `"abc"`, `"9007199254740992"` (mayor que `MAX_SAFE_INTEGER`) | RF-11 |
| `parseGoal`: rechaza valores no cadena (`true`, `null`, `{}`, `300`, `undefined`) | RF-11 |
| Ida y vuelta: `parseGoal(String(300)) === 300` (el formato canónico se recupera tal cual) | RF-10 |
| Determinismo: misma entrada dos veces → mismo resultado (`deepEqual`) | RNF-5 |
| Rendimiento: `countWeekMinutes` sobre 5.000 sesiones en < 100 ms (medido con `performance.now()`; margen amplio) | RNF-9 |

Comprobaciones que quedan en **verificación manual** (no son lógica pura): ubicación y contenido de
la tarjeta (RF-5), foco y rechazo de valores inválidos del formulario (RF-4), pre-rellenado y
edición (RF-3), actualización al guardar sin recargar (RF-12), persistencia y no modificación de
`diario-estudio-sessions` (RF-10), accesibilidad y contraste (RNF-4) y 375 px (RNF-8).

### 9.1 Notas sobre las tres observaciones menores de redacción

No bloquean la aprobación; se resuelven tal como sigue:

- **Pluralización del `aria-valuetext` con objetivo de 1 minuto**: `formatGoalValueText` se construye
  con `formatMinutes` para cada cifra, así que un objetivo de 1 minuto da "1 de 1 minuto, 100 %".
  Se añade un test con `goal === 1` que comprueba ese texto exacto (cierra la observación del QA).
- **Formulación duplicada del estado sin objetivo**: el plan deja el texto **una sola vez** en
  `formatGoalText` (RF-9) y `index.html` no duplica la cadena; `renderGoal()` la escribe siempre
  desde esa función, así que no hay dos formulaciones que puedan divergir. Se verifica en
  la verificación manual (estado sin objetivo) y con el test de `formatGoalText`.
- **Precisión del rango semiabierto en RF-6**: el rango se implementa **cerrado en ambos extremos**
  (`>= lunes && <= domingo`) y se documenta explícitamente en el test "sesión futura dentro de la
  misma semana cuenta", de modo que no hay ambigüedad sobre el domingo.

## 10. Cumplimiento de la Constitución

- **P1 - Simplicidad**: sin dependencias ni build; un `<script>` y una sección más; `logic.js` deja
  el proyecto ejecutable con doble clic (RNF-1).
- **P2 - La spec manda**: cada bloque indica sus RF; no hay decisiones fuera de la spec aprobada
  (sin dudas abiertas, §10).
- **P3 - Lógica aparte**: minutos de la semana, progreso y parseo del objetivo son funciones puras
  de `logic.js`, sin DOM ni `localStorage`, recibiendo "hoy" como parámetro (RNF-7).
- **P4 - Tests como puerta**: primero `logic.js`/`logic.test.js` en verde (`node --test`), luego la
  interfaz; no se avanza con tests en rojo (RNF-6).
- **P5 - Datos sagrados**: `diario-estudio-sessions` no se toca; el objetivo vive en una clave nueva
  y un valor corrupto nunca se borra al leerlo (RF-10, RF-11).
- **P6 - Idioma**: identificadores en inglés; textos y documentación en español (RNF-3).

## 11. Riesgos y decisiones abiertas

- **Contraste del campo**: el placeholder (`#6e8087`) y el borde actual del `input` pueden no llegar
  a 4.5:1/3:1 sobre `--paper`. Mitigación: ajustar solo el color en `styles.css` (permitido por la
  spec §9). Es la verificación más susceptible de fallar y se mide con Chrome DevTools.
- **`type="number"` y `1e3`**: el control admite notación con exponente; el test/verificación debe
  confirmar que se normaliza a `"1000"` antes de guardar (RF-4/RF-10).
- **Test de rendimiento (RNF-9)**: se mide con 5.000 sesiones y `< 100 ms`; el margen es muy amplio,
  pero conviene no acumular trabajo en el bucle (usa `minutesByDay` + una pasada por las fechas).
- **"Esta semana" más estricta**: al pasar por `minutesByDay`, sesiones con minutos inválidos ya no
  suman; es el comportamiento deseado por RF-6, pero cambia una cifra existente en datos corruptos
  (no en datos generados por la app). Se cubre con tests.
- **Sin fusión de filas del día**: no aplica aquí; no hay decisión abierta (spec §10).
- **Observaciones menores de redacción**: resueltas en 9.1 sin cambiar la spec (el estado sigue
  aprobado).

## 12. Orden de trabajo

1. `logic.js`: `getWeekEndISO`, `countWeekMinutes`, `buildWeeklyProgress`, `parseGoal`,
   `formatGoalText`, `formatGoalValueText` + exports; `logic.test.js` con los casos nuevos; dejar
   `node --test` en verde (20 existentes + nuevos).
2. `index.html`: sección `.goal-card` entre `.streak-card` y `.heat-card`.
3. `app.js`: refactor de `updateWeekTotal()` (quitar `getWeekRange()`/`countWeekMinutes()`), lectura
   del objetivo, `renderGoal()`, `handleGoalSubmit()` y llamadas en `init()`/`handleSubmit()`.
4. `styles.css`: tarjeta, barra y relleno amarillo, estado cumplido, contraste y 375 px.
5. `AGENTS.md` y `MEMORY.md`.
6. Verificación manual con el MCP de Chrome DevTools.

## 13. Verificación manual (Chrome DevTools)

- `file://` con `diario-estudio-goal` vacía: estado sin objetivo → "0 minutos · Sin objetivo · Fija uno",
  barra vacía, campo vacío, sin "¡Objetivo cumplido!" y sin `progressbar` en el árbol de accesibilidad (RF-9).
- Guardar objetivo 300 con 120 minutos en la semana → "120 de 300 minutos", barra al 40 %,
  `aria-valuetext="120 de 300 minutos, 40 %"` (RF-5, RF-7, RNF-4).
- Añadir sesiones hasta superar el objetivo → barra llena con subrayador amarillo, "¡Objetivo cumplido!",
  minutos reales ("350 de 300 minutos", `aria-valuenow` en el máximo) (RF-8).
- Recargar → el campo queda pre-rellenado con el objetivo (RF-3) y `diario-estudio-goal` es `"300"`
  (forma canónica); `diario-estudio-sessions` no cambia de formato ni de contenido (RF-10).
- Editar el objetivo a uno menor que los minutos ya estudiados → pasa a "¡Objetivo cumplido!" al
  instante sin recargar (RF-3, RF-12).
- Guardar objetivo vacío, `0` o texto → se rechaza, no cambia el progreso y el foco vuelve al campo (RF-4).
- Valor corrupto en `localStorage` (`"abc"`, `" 300 "`, `"0300"`) + recargar → "Sin objetivo", sin
  borrar la clave y sin errores en consola (RF-11).
- Comparar "Esta semana" con "X de Y minutos": coinciden (RF-6).
- Consola limpia; 375 px sin desbordamiento horizontal y campo/botón apilados si no caben (RNF-8);
  contraste medido ≥ 4.5:1 en textos y ≥ 3:1 en el contorno de la barra (RNF-4).
