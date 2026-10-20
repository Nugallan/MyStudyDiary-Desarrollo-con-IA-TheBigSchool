# Spec 002 - Objetivo semanal de estudio

- Estado: borrador (revisión 2)
- Fecha: 2026-10-19
- Revisión 1: corrige los hallazgos del reviewer: cualificación del caso de clave corrupta, nombre accesible en todos los estados y redondeo del porcentaje, unificación del cálculo de minutos de la semana en `logic.js`, etiquetas EARS, definición del estado "Sin objetivo", pluralización, textos visibles fijados en los RF, parsing y foco, "progreso" en RF-12, contraste y teclado en criterios de finalización, y `console.warn` admitido en RF-11.
- Revisión 2: corrige los 8 hallazgos de la revisión QA: fuente única del cálculo de la semana derivada de `getWeekStartISO()` (con refactor de "Esta semana"), formato canónico y regla de parseo del valor guardado, tests del parseo, nombre accesible y roles concretos, pares de contraste exigidos, pre-rellenado restringido al caso "ya hay objetivo", contenido completo del estado sin objetivo, y criterios de finalización con accesibilidad, edición de objetivo y rendimiento.

## 1. Contexto y objetivo

El Diario de Estudio ya muestra los minutos de la semana en curso, pero es una cifra sin referencia: no dice cuánto se quería estudiar. El objetivo es poder **fijar cuántos minutos se quieren estudiar cada semana** y ver el progreso (minutos estudiados esta semana frente al objetivo), con un motivo visual claro de cumplimiento.

El porqué: tener una meta concreta y ver la barra llenarse motiva a cumplirla más que un número suelto.

## 2. Usuarios

- Persona que estudia por su cuenta (público del proyecto, posible principiante en programación).
- Uso individual: una sola persona, un solo navegador. No hay cuentas, usuarios múltiples ni sincronización.

## 3. Historias de usuario

- HU-1: Como estudiante, quiero fijar una vez cuántos minutos por semana quiero estudiar para no tener que recordármelo cada semana.
- HU-2: Como estudiante, quiero ver cuántos minutos llevo esta semana frente a mi objetivo para saber cuánto me falta.
- HU-3: Como estudiante, quiero ver un motivo visual claro cuando cumpla el objetivo para celebrar el logro.
- HU-4: Como estudiante, quiero editar el objetivo cuando cambien mis circunstancias.
- HU-5: Como estudiante, quiero poder fijar el objetivo en cualquier momento sin recargar la página.

## 4. Requisitos funcionales

Notación EARS usada: **(Ubicuo)** siempre, **(Evento)** cuando ocurre algo, **(Estado)** mientras se da una condición, **(Condición)** si se cumple algo.

**RF-1 - Objetivo único y recurrente.**
- (Ubicuo) El sistema debe mantener un único objetivo de minutos por semana que se aplica a todas las semanas por igual: no hay un objetivo distinto por semana ni historial de objetivos.

**RF-2 - Crear el objetivo.**
- (Estado) Mientras no haya objetivo guardado válido —valor ausente o inválido (RF-11)—, el campo de la tarjeta debe aparecer vacío para crear uno nuevo; en este estado nunca se pre-rellena con un valor inventado, solo puede contener lo que la persona acabe de teclear.
- (Evento) Cuando la persona introduce un número válido y guarda, el sistema debe crear el objetivo y mostrar el progreso al instante, sin recargar la página.

**RF-3 - Editar el objetivo.**
- (Estado) Mientras haya un objetivo guardado válido —y solo en ese estado—, el campo de la tarjeta debe mostrar el objetivo actual como valor inicial (pre-rellenado), tanto al cargar la página como después de guardar, para editarlo.
- (Evento) Cuando la persona cambia el valor y guarda, el sistema debe sustituir el objetivo por el nuevo y recalcular el progreso al instante.

**RF-4 - Validación y parsing del objetivo.**
- (Ubicuo) El campo del objetivo debe ser un número entero ≥ 1, con `required` y `min="1"` en el formulario (con `novalidate` como el resto) y validación también en JS.
- (Ubicuo) El valor introducido se interpreta en JS convirtiendo el contenido del campo con `Number()`: se acepta si el resultado es un número entero ≥ 1 y seguro (`Number.isSafeInteger`); en cualquier otro caso (vacío, texto no convertible, decimal, cero o negativo) se rechaza.
- (Ubicuo) Al guardar un valor válido, este se normaliza antes de persistirse a la forma canónica de RF-10 (por ejemplo, lo que el campo devuelva como `1e3` se guarda como `"1000"`).
- (Condición) Si el valor no supera la validación, entonces no debe guardarse ni cambiar el objetivo ni el progreso, y el foco debe ir al campo del objetivo.
- (Condición) Si el valor es válido y se guarda correctamente, entonces el foco debe volver al campo del objetivo, listo para una nueva edición.

**RF-5 - Ubicación y contenido de la tarjeta.**
- (Ubicuo) El sistema debe mostrar el objetivo en una tarjeta propia con el título "Objetivo semanal", situada entre la tarjeta de estadísticas (racha) y el mapa de calor.
- (Ubicuo) La tarjeta debe mostrar, en este orden: la composición "X de Y minutos" con los minutos estudiados de la semana en curso y el objetivo (por ejemplo, "120 de 300 minutos"); la barra de progreso; el campo, con el rótulo "Minutos por semana", y el botón con el texto "Guardar objetivo". Ese orden y esos controles se mantienen en todos los estados; sin objetivo, la composición es la de RF-9 y el campo aparece vacío (RF-2).

**RF-6 - Minutos de progreso (semana en curso).**
- (Ubicuo) El progreso debe contar los minutos de las sesiones cuya fecha cae en la semana natural en curso (lunes–domingo, fechas locales): incluye sesiones con fecha futura dentro de la misma semana; las sesiones de semanas anteriores o posteriores no cuentan.
- (Ubicuo) Ese cálculo debe ser una única función pura en `logic.js` que recibe "hoy" como parámetro y deriva el rango de la semana de la función pura ya existente `getWeekStartISO()` (el lunes que devuelve más seis días): la aritmética del lunes de la semana no se repite en ningún otro sitio y no se consulta el reloj dentro de la función.
- (Ubicuo) La cifra "Esta semana" de la tarjeta de estadísticas debe pasar a usar esa misma función pura, de modo que `app.js` deje de calcular el rango de la semana por su cuenta (`getWeekRange()`/`countWeekMinutes()` se sustituyen por la llamada a la función de `logic.js`).
- (Condición) Si una sesión tiene una fecha que no es válida en formato local `YYYY-MM-DD` o unos minutos que no son un número entero ≥ 1, entonces no debe contar para estos minutos (misma regla que el RF-12 de la spec 001).
- Criterio: para el mismo "hoy" y las mismas sesiones, la tarjeta de objetivo y la de estadísticas obtienen los minutos de la misma llamada a la función pura, así que coinciden por construcción y no por una comprobación puntual.

**RF-7 - Barra de progreso.**
- (Ubicuo) La barra debe representar la fracción minutos/objetivo, vacía al 0 % y llena al 100 %; nunca debe exceder el 100 % aunque los minutos superen el objetivo.
- (Estado) Mientras los minutos no alcancen el objetivo, la barra debe rellenarse proporcionalmente.

**RF-8 - Cumplimiento del objetivo.**
- (Condición) Si los minutos de la semana en curso son iguales o mayores que el objetivo, entonces la barra debe mostrarse completamente llena con el estilo del subrayador amarillo de la identidad visual y la tarjeta debe mostrar el texto "¡Objetivo cumplido!".
- (Ubicuo) Los minutos mostrados deben ser siempre los reales, en la composición "X de Y minutos" (por ejemplo, "350 de 300 minutos"), aunque la barra esté llena.
- (Ubicuo) Todas las cifras de la tarjeta —minutos estudiados y objetivo, sueltas o en la composición— deben usar la misma pluralización que el resto de la app ("1 minuto" / "125 minutos"), aplicada a cada cifra por separado (por ejemplo, "1 de 300 minutos" o "45 de 1 minuto").

**RF-9 - Estado sin objetivo.**
- (Condición) Si no hay objetivo guardado válido (RF-11), entonces la tarjeta debe estar visible con los minutos de la semana en curso mostrados igualmente, el objetivo sustituido por el texto "Sin objetivo" y el texto simple "Fija uno" (por ejemplo, "120 minutos · Sin objetivo · Fija uno"), la barra vacía (sin relleno, 0 %) y sin texto de cumplimiento; la sección nunca se oculta, para poder fijar el objetivo en cualquier momento.
- (Ubicuo) En ese estado el resto de la tarjeta es el de creación (RF-2): campo vacío con el rótulo "Minutos por semana" y botón "Guardar objetivo"; no se muestra ninguna otra cifra de objetivo ni porcentaje.
- (Ubicuo) "Sin objetivo · Fija uno" debe ser un texto simple, no interactivo: no es enlace ni botón, no recibe foco, no entra en el orden de tabulación y no muestra cursor de mano; el modo de fijarlo es el campo de la tarjeta (que aparece vacío, RF-2) y su botón.

**RF-10 - Persistencia.**
- (Ubicuo) El objetivo debe guardarse en `localStorage` con la clave `diario-estudio-goal`, cuyo valor es una cadena de dígitos decimales exacta que representa un entero ≥ 1, en forma canónica: solo dígitos `0-9`, sin signo, sin espacios, sin separador decimal, sin exponente y sin ceros a la izquierda (por ejemplo, `"300"`). Se persiste con `String(entero)`, nunca como número, booleano, objeto ni JSON.
- (Ubicuo) Al cargar, el valor guardado se valida con la regla exacta de RF-11; un objetivo guardado por esta versión se recupera tal cual tras recargar.
- (Ubicuo) La clave existente `diario-estudio-sessions` y el formato de las sesiones no deben tocarse: crear ni editar el objetivo nunca modifica ni borra sesiones.

**RF-11 - Datos guardados ausentes o inválidos.**
- (Ubicuo) La validación del valor guardado debe ser una función pura de `logic.js` que recibe el valor leído de `localStorage` (cadena o ausencia) y devuelve el entero o "sin objetivo"; `app.js` solo lee `localStorage` y llama a esa función, sin lógica de parseo propia.
- (Condición) Si `diario-estudio-goal` no existe, no se puede leer (almacenamiento no disponible), su lectura lanza error o su contenido no cumple exactamente el formato canónico de RF-10, entonces el sistema debe tratarlo como "sin objetivo" (RF-9), sin modificar ni borrar lo guardado. Se consideran inválidos, entre otros: `""`, `" 300 "` (espacios), `"300.0"`, `"1e3"`, `"0300"` (ceros a la izquierda), `"0"`, `"-5"`, `"abc"`, y cualquier valor que no sea una cadena de dígitos (por ejemplo `true`, `null`, `{}` o el número `300`), aunque `localStorage` no los produzca.
- (Ubicuo) El rango aceptado es 1 … `Number.MAX_SAFE_INTEGER`; un valor mayor se trata como inválido (no se inventan cifras).
- (Ubicuo) En los casos anteriores se admite un aviso con `console.warn` al leer el dato (mismo patrón que `loadSessions`), pero no se permite un error (`console.error` o excepción sin capturar) en consola.

**RF-12 - Actualización.**
- (Evento) Cuando se guarda una sesión correctamente o se crea/edita el objetivo, el progreso —minutos de la semana, barra y estado de cumplimiento— debe actualizarse sin recargar la página, tomando como "hoy" la fecha del momento.
- (Condición) Si el formulario de sesión o el del objetivo no superan la validación, entonces el progreso no debe cambiar.
- (Ubicuo) Fuera de la carga y del guardado, el progreso no debe recalcularse por sí solo: si la página queda abierta cruzando la medianoche, mantiene la referencia hasta la siguiente recarga o guardado.

## 5. Requisitos no funcionales

- RNF-1: Sin dependencias ni build nuevos; se sigue abriendo con doble clic (Constitución 1).
- RNF-2: Todas las fechas (la semana en curso) se calculan en la zona horaria local del usuario, nunca en UTC (coherente con racha, semana y mes).
- RNF-3: Textos visibles en español; código en inglés (Constitución 6).
- RNF-4: Accesibilidad:
  - El estado de la barra no debe depender solo del color: además del relleno debe estar el texto con los minutos y el objetivo, y "¡Objetivo cumplido!" cuando proceda.
  - La tarjeta es una sección con nombre accesible "Objetivo semanal" tomado del título visible (`aria-labelledby`).
  - Con objetivo válido, la barra se expone como `role="progressbar"` con nombre accesible también "Objetivo semanal" (`aria-labelledby` al título), `aria-valuemin="0"`, `aria-valuemax` igual al objetivo, `aria-valuenow` igual a `min(minutos, objetivo)` (nunca mayor que el máximo, coherente con RF-7) y `aria-valuetext` en formato español "X de Y minutos, N %" (por ejemplo, "120 de 300 minutos, 40 %"), donde X son los minutos reales e Y el objetivo, y N es el porcentaje entero `min(100, Math.round(100 · X / Y))`; el porcentaje solo es informativo (la barra usa la fracción exacta, RF-7). Al pasarse del objetivo, `aria-valuetext` dice los minutos reales ("350 de 300 minutos, 100 %") y `aria-valuenow` queda en el máximo.
  - Sin objetivo válido no se expone `role="progressbar"` (no hay máximo que anunciar): el relleno es decorativo (`aria-hidden="true"`) y el estado lo comunica el texto visible "X minutos · Sin objetivo · Fija uno", sin porcentaje ni cifra inventada.
  - Los atributos accesibles deben actualizarse al guardar, igual que el contenido visible (RF-12).
  - Los pares que deben cumplir 4.5:1 (texto normal, WCAG AA) son: el título "Objetivo semanal"; el texto de la composición de minutos; "Sin objetivo" y "Fija uno"; "¡Objetivo cumplido!"; el rótulo "Minutos por semana"; el texto del botón "Guardar objetivo" sobre el fondo del botón; y el valor visible del campo (incluido el placeholder cuando está vacío) sobre el fondo del campo. La barra queda fuera del 4.5:1 porque no es texto y su estado no depende del color (hay texto equivalente): a cambio, su contorno o trazo debe distinguirse del fondo de la tarjeta con al menos 3:1 (WCAG 1.4.11) y debe verse el relleno frente a la pista vacía. Si el estilo actual del campo (texto de placeholder o borde) no alcanza estos umbrales, se ajusta el color en esta implementación; no se cambia la estructura.
  - El campo y el botón deben ser recorribles y activables con teclado, en ese orden; "Fija uno" no entra en el orden de tabulación (RF-9).
  - (Opcional, no bloqueante) Se recomienda `aria-live="polite"` en el texto de progreso o de cumplimiento para anunciar el cambio tras guardar, y comprobar que la barra sigue distinguiéndose con el modo forzado de colores (`forced-colors`). El 100 de accesibilidad actual de Lighthouse es la línea base: no debe bajar.
- RNF-5: Determinismo: el cálculo del progreso debe depender solo de las sesiones, del objetivo y de una fecha "hoy" recibida como entrada, sin consultar el reloj por su cuenta (Constitución 3).
- RNF-6: Tests: la lógica nueva y afectada debe cubrirse con tests automáticos ejecutables con `node --test` sin instalar paquetes; no se avanza con tests en rojo (Constitución 4). Incluye obligatoriamente: el rango de la semana a partir de "hoy" con "hoy" en lunes, con "hoy" en domingo y con cambio de año (por ejemplo, semana que cruza del 29/12 al 4/1); los minutos de la semana en curso; el progreso y el estado de cumplimiento (umbral ≥, límite al 100 %); y la lectura/validación del objetivo guardado (RF-11) con todos los valores corruptos de §6.
- RNF-7: Estructura: los cálculos nuevos y el cálculo de los minutos de la semana en curso viven como funciones puras (sin DOM ni `localStorage`) en `logic.js`, que reciben "hoy" como parámetro y reutilizan `getWeekStartISO()` (RNF-5, RF-6); la validación del objetivo guardado (RF-11) es otra función pura que no toca `localStorage`; `app.js` solo pinta, lee/guarda y llama a esas funciones.
- RNF-8: Responsive: usable a 375 px de ancho sin desbordamiento horizontal; si campo y botón no caben en una línea, se apilan.
- RNF-9: Rendimiento: el progreso debe calcularse en menos de 100 ms con hasta 5.000 sesiones, comprobado con un test de `node --test` que mide el cálculo de la función pura sobre 5.000 sesiones (el margen es amplio, así que el test no debe ser inestable).

## 6. Casos límite

- Sin ninguna sesión y con objetivo: 0 minutos, barra vacía, sin "¡Objetivo cumplido!".
- Sin objetivo guardado: estado "120 minutos · Sin objetivo · Fija uno" con el campo vacío, los minutos de la semana mostrados igualmente y la barra vacía; no es un estado de error.
- `diario-estudio-goal` corrupta (por ejemplo, `"abc"`, `{}`, `null`, `-5`, `2.5`): se trata como sin objetivo (RF-11); no se borra ni se sobrescribe mientras el usuario no guarde un objetivo nuevo (guardar un objetivo válido sí la sobrescribe, RF-2/RF-3).
- Formas no canónicas del valor guardado (`" 300 "`, `"300.0"`, `"1e3"`, `"0300"`, `""`): se tratan como sin objetivo, igual que si la clave no existiera (RF-11).
- Valor guardado que no es una cadena de dígitos (el número `300`, `true`, `null`, un objeto): se trata como sin objetivo (RF-11).
- Valor guardado mayor que `Number.MAX_SAFE_INTEGER`: se trata como sin objetivo (RF-11).
- Objetivo válido guardado y recarga: el campo se pre-rellena con él (RF-3) y el progreso se calcula igual que antes de recargar (ida y vuelta del formato canónico).
- Campo del objetivo con `1e3` (el control numérico lo admite como 1000): se acepta y se guarda como `"1000"`; no queda en `localStorage` la forma con exponente.
- Guardar el campo vacío, `0` o un valor no numérico: se rechaza sin cambiar el objetivo ni el progreso y el foco vuelve al campo (RF-4).
- Almacenamiento no disponible: la app sigue funcionando en la sesión actual; el objetivo no persiste y no hay errores en consola.
- Minutos de la semana iguales al objetivo justo: cumplido (umbral inclusivo ≥).
- Minutos de la semana muy por encima del objetivo (por ejemplo, 10.000 de 300): barra llena, "¡Objetivo cumplido!" y se muestran los minutos reales.
- Objetivo de 1 minuto: válido; se cumple con la primera sesión de un minuto.
- Objetivo muy alto (por ejemplo, 100.000): válido; la barra avanza proporcionalmente.
- Sesión con fecha futura dentro de la misma semana natural: cuenta para el progreso (misma regla que "Esta semana", RF-6).
- Sesión de una semana anterior o posterior: no cuenta para el progreso de esta semana.
- Editar el objetivo a un valor menor que los minutos ya estudiados: al guardar pasa directamente a "¡Objetivo cumplido!" con la barra llena.
- Cambio de semana, de mes o de año y cambio de hora (horario de verano/invierno): el progreso se recalcula con fechas locales, sin aritmética de milisegundos.
- Cruce de medianoche con la página abierta: no se reancla hasta la siguiente recarga o guardado (RF-12).
- "Hoy" en lunes (semana casi entera futura) o en domingo (semana completa): la semana en curso es la que contiene hoy.
- Guardar el objetivo con el mismo valor: no rompe nada; se vuelve a guardar y el progreso no cambia.

## 7. Fuera de alcance

- Objetivos diarios, mensuales o por materia/tema.
- Un objetivo distinto por semana o historial de objetivos anteriores: el objetivo es único y recurrente.
- Borrar el objetivo para volver al estado "sin objetivo" (solo crearlo y editarlo).
- Notificaciones, recordatorios o avisos de cumplimiento.
- Medallas, rangos, animaciones o celebraciones más allá del texto y el subrayador (RF-8).
- Comparativas entre personas, exportar o importar datos.
- Cambiar la regla de la semana: sigue siendo la semana natural lunes–domingo en fechas locales.

## 8. Criterios de finalización

- Todos los RF cumplidos y verificables con sus criterios.
- Lógica del objetivo cubierta por tests automáticos con `node --test` en verde, sin paquetes instalados: incluye el rango semanal con hoy en lunes, hoy en domingo y cambio de año, el parseo del valor guardado (RF-11) con los casos de §6, y el test de rendimiento con 5.000 sesiones (RNF-9).
- Verificación manual con el MCP de Chrome DevTools: sin errores en consola y vista de 375 px sin desbordes; probados al menos los casos: sin objetivo, progreso parcial, cumplimiento (minutos ≥ objetivo), objetivo corrupto en `localStorage` y **editar el objetivo existente** (RF-3/HU-4: cambia el valor, se recalcula al instante y persiste al recargar).
- Accesibilidad de la tarjeta de objetivo comprobada (RNF-4): snapshot de accesibilidad en los tres estados (sin objetivo, parcial, cumplido) con el rol y el `aria-valuetext` esperados y sin `progressbar` cuando no hay objetivo; recorrido completo por teclado (campo y botón, en ese orden, con el foco de vuelta en el campo tras guardar, RF-4) y "Fija uno" fuera del orden de tabulación; contraste medido en los pares de RNF-4 (sin bajar de 4.5:1 en texto y de 3:1 en el contorno de la barra).
- Comprobado que `diario-estudio-sessions` no cambia de formato ni se modifica al crear/editar el objetivo, y que el valor de `diario-estudio-goal` queda en forma canónica tras guardar.
- Sin dependencias ni build nuevos; se abre con doble clic.
- `AGENTS.md` y `MEMORY.md` actualizados; textos en español. `AGENTS.md` debe reflejar que "Esta semana" ya no calcula el rango por su cuenta sino que usa la función pura compartida (RF-6).

## 9. Decisiones

- Objetivo único recurrente: un solo número de minutos por semana que vale para todas las semanas (decisión del usuario).
- La tarjeta de objetivo está siempre visible; sin objetivo se muestran los minutos de la semana, el objetivo como "Sin objetivo", el texto simple "Fija uno" (no interactivo ni enfocable) y la barra vacía (decisión del usuario).
- El cálculo de los minutos de la semana se unifica en una única función pura de `logic.js` con "hoy" como parámetro, derivada de `getWeekStartISO()`, compartida por "Esta semana" y el progreso: hasta ahora vivía en `app.js` con el reloj directo y sin validar minutos. Se decide **refactorizar "Esta semana"** para que use esa función (y no un cotejo puntual): así las dos cifras no pueden contradecirse y quedan cubiertas por `node --test`; implica actualizar `AGENTS.md`.
- Nombre accesible de la barra en formato español "X de Y minutos, N %" con el porcentaje entero redondeado con `Math.round` y limitado a 100 (solo informativo, la barra usa la fracción exacta); la barra se expone como `progressbar` con `aria-valuenow` limitado al objetivo y `aria-valuetext` con los minutos reales. Sin objetivo no se expone `progressbar` y el relleno queda decorativo: el estado lo dice el texto visible (decisión del usuario).
- Parsing del campo del objetivo: se acepta lo que el campo number+min=1 produce, validando entero ≥ 1 y seguro tras `Number()`, y se normaliza a forma canónica antes de guardar; si es inválido el foco va al campo y tras guardar el foco vuelve al campo, listo para editar.
- Formato guardado: cadena canónica de dígitos (`^[1-9][0-9]*$`, por ejemplo, `"300"`), sin espacios, decimales, exponente ni ceros a la izquierda. Cualquier otra cosa —incluidas las formas no canónicas y los valores que no son cadenas— se trata como sin objetivo, se borre o no; el parseo es una función pura de `logic.js` y se prueba con `node --test`.
- Contraste acotado: se exige 4.5:1 solo al texto y a los controles de la tarjeta (título, cifras, "Sin objetivo", "Fija uno", "¡Objetivo cumplido!", rótulo, texto del botón, valor del campo); la barra queda fuera porque no es texto y su estado no depende del color, pero su contorno debe llegar a 3:1 frente al fondo de la tarjeta. Si el placeholder o el borde actuales del campo no llegan, se ajustan de color en la implementación.
- Textos fijados en los RF: título "Objetivo semanal", composición "X de Y minutos", rótulo del campo "Minutos por semana", botón "Guardar objetivo" y "¡Objetivo cumplido!".
- Motivo visual de cumplimiento: barra completamente llena con el subrayador amarillo de la identidad visual más el texto "¡Objetivo cumplido!"; sin animaciones ni emojis (decisión del usuario).
- Persistencia: clave nueva `diario-estudio-goal` con solo el número entero de minutos, guardado como cadena canónica de dígitos; `diario-estudio-sessions` no se toca (decisión del usuario; la Constitución 5 protege los datos existentes).
- Ubicación: tarjeta propia entre las estadísticas y el mapa de calor, sin meter la barra en la tarjeta de racha (allí ya hay tres cifras y en móvil se apilan).
- El progreso usa la misma semana natural lunes–domingo y las mismas reglas que "Esta semana" (fechas locales, incluidas fechas futuras de la misma semana) para que las dos cifras nunca contradigan.
- La barra se limita al 100 % pero los minutos mostrados son siempre los reales: exceder el objetivo se ve como "350 de 300 · ¡Objetivo cumplido!".
- El valor guardado se valida también al cargar: cualquier cosa que no sea una cadena canónica de dígitos que represente un entero entre 1 y `Number.MAX_SAFE_INTEGER` se trata como "sin objetivo" sin tocar el almacenamiento (el formulario, en cambio, es más tolerante y normaliza antes de guardar).
- RNF-9 se verifica con un test de `node --test` sobre 5.000 sesiones en vez de dejarlo sin comprobar: el límite de 100 ms es tan holgado que el test no debería ser inestable.
- "Hoy" se reancla solo al cargar y al guardar (sesión u objetivo), como el mapa de calor; sin temporizadores.
- Sin borrado del objetivo en esta versión: cambios pequeños y enfocados; si se necesita, será otra spec.

## 10. Dudas abiertas

Ninguna: las cuatro dudas de inicio se resolvieron con el usuario (sección 9).
