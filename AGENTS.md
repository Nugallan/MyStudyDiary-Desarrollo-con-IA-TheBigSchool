# AGENTS.md - MyStudyDiary

## Descripción del proyecto

Web estática y sencilla de "Diario de Estudio" para registrar sesiones de estudio y ver la racha actual. HTML, CSS y JavaScript puros, sin frameworks, sin herramientas de compilación y sin dependencias.

- **Ubicación**: `MyStudyDiary/` (dentro de este workspace)
- **Archivos**: solo `index.html`, `styles.css` y `app.js`
- **Ejecución**: abriendo `index.html` directamente en el navegador (funciona con `file://`)

## Ejecutar / verificar

No existen comandos de build, test, lint ni typecheck. Para verificar:

1. Abrir `index.html` en el navegador (doble clic)
2. Añadir una sesión con fecha (por defecto hoy), tema y minutos > 0
3. Comprobar la racha, el orden de la lista (más reciente primero) y que `localStorage` persiste al recargar

## Comportamiento clave que hay que conservar

- **Solo fechas locales**: todas las fechas se guardan como `YYYY-MM-DD` calculadas con `getFullYear()`, `getMonth()+1` y `getDate()` (nunca UTC). Lo mismo para el cálculo de la racha.
- **Regla de la racha**: días consecutivos con al menos una sesión que terminan hoy. Si hoy no hay sesión pero ayer sí, la racha sigue "viva" (el ancla es ayer). Un mismo día no cuenta dos veces.
- **Mejor racha**: el tramo de días consecutivos con sesión más largo de todo el historial, calculado con las mismas fechas locales. No aplica la regla "sigue viva" (esa es solo para la racha actual): es un máximo histórico y se conserva aunque la racha actual se rompa. Se deriva de las sesiones y no añade datos nuevos a `localStorage`. La interfaz muestra `max(mejor racha, racha actual)`.
- **Orden de las sesiones**: ordenadas por fecha descendente y, en caso de empate, por `createdAt` descendente (más reciente primero).
- **Minutos de la semana**: suma de los minutos de las sesiones cuya fecha cae en la semana natural en curso (lunes–domingo, fechas locales). Se deriva de las sesiones y no añade datos nuevos a `localStorage`. Incluye cualquier sesión con fecha dentro del rango, incluso futura dentro de la misma semana.
- **Días del mes**: número de días únicos con al menos una sesión cuya fecha cae en el mes natural en curso (fechas locales). Se deriva de las sesiones y no añade datos nuevos a `localStorage`. Incluye cualquier sesión con fecha dentro del mes, incluso futura dentro del mismo mes. Varias sesiones el mismo día cuentan como un solo día.
- **Persistencia**: `localStorage` con la clave `diario-estudio-sessions` guarda un array de objetos de sesión `{ id, date, topic, minutes, createdAt }`.
- **Validación**: `required` + `min="1"` en HTML; el formulario usa `novalidate` para evitar los mensajes del navegador; el JS también valida.
- **UX**: tras guardar, el formulario se reinicia pero la fecha vuelve a hoy; el foco va al campo de tema.

## Notas de arquitectura

- Punto de entrada: `index.html` carga `styles.css` y `app.js` al final.
- En `app.js` los elementos del DOM se obtienen por id (deben existir).
- El cálculo de la racha construye un Set de días estudiados, elige el ancla (hoy o ayer) y recorre hacia atrás contando días consecutivos presentes.
- La mejor racha usa ese mismo Set de días: lo ordena y recorre midiendo el tramo consecutivo más largo.
- Los minutos de la semana se calculan con `getWeekRange()` (semana local de lunes a domingo que contiene hoy) y se suman con `countWeekMinutes()`; `updateWeekTotal()` los pinta.
- Los días del mes se calculan reutilizando `getDayKeysSet()` (días únicos) y comparando el prefijo `"AAAA-MM"` del mes en curso con `getCurrentMonthPrefix()`; `countMonthDays()` los cuenta y `updateMonthDays()` los pinta.

## Forma de trabajar

- Haz solo lo que se pide: no añadas funcionalidades por tu cuenta.
- Cambios pequeños y enfocados; no reescribas lo que ya funciona
- Al terminar, resume qué has cambiado y cualquier decisión que deba revisar.

## Memoria

- Al empezar, lee `MEMORY.md` para conocer el estado del proyecto y las decisiones tomadas.
- Al terminar una tarea, actualízalo: estado actual, decisiones.importantes (con su porqué) y errores a evitar.
- Mantenlo breve (máximo ~50 líneas): resume o elimina lo que ya no aporte.
- Si algo se convierte en una regla permanente, propón moverlo a `AGENTS.md` en lugar de dejarlo en la memoria.
- No guardes nunca datos sensibles (claves, tokens, datos personales).

## Comandos

- Tests: `node --test`

## Reglas

- Lee: `docs/constitution.md` y la spec activa (`specs/NNN-*`) antes de tocar código.

## Límites

- Siempre: respetar las reglas de fechas y racha, mantener los textos en español.
- Siempre: actualizar `MEMORY.md` al terminar cada tarea.
- Pregunta antes: crear archivos nuevos, cambiar el formato de los datos guardados.
- Nunca: añadir dependencias, frameworks o un paso de build.

## Verificación

- No hay tests automáticos. Después de cada cambio, verifica con el MCP de Chrome DevTools: abre `index.html`, prueba la funcionalidad, revisa la consola y comprueba la vista móvil.
- Para empezar de cero: DevTools -> Application -> Local Storage -> borrar la clave `diario-estudio-sessions`.
