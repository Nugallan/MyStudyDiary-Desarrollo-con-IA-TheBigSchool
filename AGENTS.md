# AGENTS.md - MyStudyDiary

## Descripción del proyecto

Web estática y sencilla de "Diario de Estudio" para registrar sesiones de estudio y ver la racha actual y el objetivo semanal. HTML, CSS y JavaScript puros, sin frameworks, sin herramientas de compilación y sin dependencias.

- **Ubicación**: `MyStudyDiary/` (dentro de este workspace)
- **Archivos**: `index.html`, `styles.css`, `app.js` y `logic.js` (lógica pura), más los tests `*.test.js`
- **Ejecución**: abriendo `index.html` directamente en el navegador (funciona con `file://`)

## Ejecutar / verificar

No hay build, lint ni typecheck. La lógica pura se prueba con `node --test` (sin instalar dependencias) y el resto se verifica a mano en el navegador:

1. Abrir `index.html` en el navegador (doble clic)
2. Añadir una sesión con fecha (por defecto hoy), tema y minutos > 0
3. Comprobar la racha, el orden de la lista (más reciente primero) y que `localStorage` persiste al recargar
4. Comprobar el mapa de calor de las últimas 12 semanas (niveles por minutos y detalle al pasar el puntero o tocar)
5. Comprobar el objetivo semanal: fijarlo, ver el progreso (barra y composición) y "¡Objetivo cumplido!" al alcanzarlo

## Comportamiento clave que hay que conservar

- **Solo fechas locales**: todas las fechas se guardan como `YYYY-MM-DD` calculadas con `getFullYear()`, `getMonth()+1` y `getDate()` (nunca UTC). Lo mismo para el cálculo de la racha.
- **Regla de la racha**: días consecutivos con al menos una sesión que terminan hoy. Si hoy no hay sesión pero ayer sí, la racha sigue "viva" (el ancla es ayer). Un mismo día no cuenta dos veces.
- **Mejor racha**: el tramo de días consecutivos con sesión más largo de todo el historial, calculado con las mismas fechas locales. No aplica la regla "sigue viva" (esa es solo para la racha actual): es un máximo histórico y se conserva aunque la racha actual se rompa. Se deriva de las sesiones y no añade datos nuevos a `localStorage`. La interfaz muestra `max(mejor racha, racha actual)`.
- **Orden de las sesiones**: ordenadas por fecha descendente y, en caso de empate, por `createdAt` descendente (más reciente primero).
- **Minutos de la semana**: suma de los minutos de las sesiones cuya fecha cae en la semana natural en curso (lunes–domingo, fechas locales). Se deriva de las sesiones y no añade datos nuevos a `localStorage`. Incluye cualquier sesión con fecha dentro del rango, incluso futura dentro de la misma semana. Es la **fuente única** que comparten la cifra "Esta semana" y el progreso del objetivo (misma función pura `countWeekMinutes`), de modo que ambas cifras coinciden por construcción.
- **Objetivo semanal**: minutos por semana que se quieren estudiar, guardados como una única cifra recurrente (no hay uno por semana ni historial). Se muestran en una tarjeta propia "Objetivo semanal" situada **entre la tarjeta de estadísticas (racha) y el mapa de calor**, con la composición "X de Y minutos" (minutos de la semana en curso y objetivo), la barra de progreso, el campo "Minutos por semana" y el botón "Guardar objetivo". Se crea y edita en cualquier momento sin recargar. Guardar el objetivo nunca toca las sesiones.
- **Progreso del objetivo**: la barra representa la fracción minutos/objetivo, vacía al 0 % y llena al 100 %; nunca supera el 100 %, pero los minutos mostrados son siempre los reales (p. ej. "350 de 300 minutos"). Si los minutos igualan o superan el objetivo (umbral inclusivo ≥), la barra se llena con el subrayador amarillo y aparece "¡Objetivo cumplido!". Sin objetivo la tarjeta sigue visible con los minutos de la semana, el objetivo como "Sin objetivo", el texto simple "Fija uno" (no interactivo ni enfocable), la barra vacía y el campo vacío.
- **Validación del objetivo**: el valor guardado válido es una cadena canónica de dígitos (`^[1-9][0-9]*$`, p. ej. `"300"`) que representa un entero entre 1 y `Number.MAX_SAFE_INTEGER`; cualquier otro valor (formas no canónicas, valores no cadena, clave ausente o lectura fallida) se trata como "sin objetivo", sin borrar ni modificar lo guardado. El campo se valida además en JS (`Number()` entero ≥ 1 y seguro) y se normaliza a forma canónica antes de guardar (lo que el control devuelva como `1e3` se guarda como `"1000"`).
- **Días del mes**: número de días únicos con al menos una sesión cuya fecha cae en el mes natural en curso (fechas locales). Se deriva de las sesiones y no añade datos nuevos a `localStorage`. Incluye cualquier sesión con fecha dentro del mes, incluso futura dentro del mismo mes. Varias sesiones el mismo día cuentan como un solo día.
- **Mapa de calor**: ventana fija de 12 semanas naturales (lunes–domingo) que termina en la semana de hoy, con una celda por día. Cinco niveles por minutos enteros del día: 0 (sin estudio), 1–29, 30–59, 60–119 y ≥120. Es de solo lectura: se deriva de las sesiones y no añade datos nuevos a `localStorage`; las sesiones fuera de la ventana no aparecen. El detalle de cada día se muestra al pasar el puntero o tocar y se oculta al tocar fuera. Se recalcula con "hoy" al cargar y al guardar (sin temporizadores).
- **Persistencia**: `localStorage` con la clave `diario-estudio-sessions` guarda un array de objetos de sesión `{ id, date, topic, minutes, createdAt }`. La clave `diario-estudio-goal` guarda el objetivo como una cadena canónica de dígitos (p. ej. `"300"`), nunca como número; `diario-estudio-sessions` no se toca al crear ni editar el objetivo.
- **Validación**: `required` + `min="1"` en HTML; el formulario usa `novalidate` para evitar los mensajes del navegador; el JS también valida.
- **UX**: tras guardar, el formulario se reinicia pero la fecha vuelve a hoy; el foco va al campo de tema.

## Notas de arquitectura

- Punto de entrada: `index.html` carga `styles.css`, `logic.js` y `app.js` al final.
- En `app.js` los elementos del DOM se obtienen por id (deben existir).
- El cálculo de la racha construye un Set de días estudiados, elige el ancla (hoy o ayer) y recorre hacia atrás contando días consecutivos presentes.
- La mejor racha usa ese mismo Set de días: lo ordena y recorre midiendo el tramo consecutivo más largo.
- Los minutos de la semana se calculan con `countWeekMinutes(sessions, todayISO)` de `logic.js`, derivada de `getWeekStartISO()`/`getWeekEndISO()` (semana local de lunes a domingo que contiene hoy); `updateWeekTotal()` la pinta. `app.js` ya no calcula el rango de la semana por su cuenta (se eliminaron `getWeekRange()`/`countWeekMinutes()` de `app.js`).
- El progreso del objetivo usa `buildWeeklyProgress(sessions, goal, todayISO)` de `logic.js` (`{ minutes, goal, ratio, cappedRatio, done, percent }`), que llama a `countWeekMinutes`; `renderGoal()` lo pinta. El objetivo guardado se lee con `parseGoal()` (pura, valida la forma canónica) y los textos con `formatGoalText()`/`formatGoalValueText()`; `app.js` solo lee/escribe `localStorage` (`loadGoal()`/`saveGoal()`), pinta y llama a esas funciones.
- Los días del mes se calculan reutilizando `getDayKeysSet()` (días únicos) y comparando el prefijo `"AAAA-MM"` del mes en curso con `getCurrentMonthPrefix()`; `countMonthDays()` los cuenta y `updateMonthDays()` los pinta.
- La lógica pura (fechas, mapa de calor y objetivo semanal) vive en `logic.js`, sin DOM ni `localStorage`, y recibe "hoy" como parámetro; funciona igual en el navegador (funciones globales) y en Node (`module.exports`). `app.js` solo pinta y guarda: `renderHeatMap()` crea las celdas con `buildHeatMap()` y las etiqueta con `formatDetail()`; `renderGoal()` pinta la tarjeta del objetivo y su barra (con `role="progressbar"` solo cuando hay objetivo).

## Forma de trabajar

- Haz solo lo que se pide: no añadas funcionalidades por tu cuenta.
- Cambios pequeños y enfocados; no reescribas lo que ya funciona
- No hagas un commit por cada interacción: agrupa los cambios y compromete cada cierto tiempo, cuando haya un conjunto coherente y verificado. El mensaje resume los agregados y las modificaciones.
- Al terminar, resume qué has cambiado y cualquier decisión que deba revisar.

## Memoria

- Al empezar, lee `MEMORY.md` para conocer el estado del proyecto y las decisiones tomadas.
- Al terminar una tarea, actualízalo: estado actual, decisiones.importantes (con su porqué) y errores a evitar.
- Mantenlo breve (máximo ~50 líneas): resume o elimina lo que ya no aporte.
- Si algo se convierte en una regla permanente, propón moverlo a `AGENTS.md` en lugar de dejarlo en la memoria.
- No guardes nunca datos sensibles (claves, tokens, datos personales).

## Comandos

- Tests: `node --test` (runner incluido en Node; sin instalar dependencias)

## Reglas

- Lee: `docs/constitution.md` y la spec activa (`specs/NNN-*`) antes de tocar código.

## Límites

- Siempre: respetar las reglas de fechas y racha, mantener los textos en español.
- Siempre: actualizar `MEMORY.md` al terminar cada tarea.
- Pregunta antes: crear archivos nuevos, cambiar el formato de los datos guardados.
- Nunca: añadir dependencias, frameworks o un paso de build.

## Verificación

- La lógica pura (fechas, rachas y estadísticas) se cubre con `node --test`; no se avanza con tests en rojo.
- Después de cada cambio, verifica con el MCP de Chrome DevTools: abre `index.html`, prueba la funcionalidad, revisa la consola y comprueba la vista móvil.
- Para empezar de cero: DevTools -> Application -> Local Storage -> borrar las claves `diario-estudio-sessions` y `diario-estudio-goal`.
