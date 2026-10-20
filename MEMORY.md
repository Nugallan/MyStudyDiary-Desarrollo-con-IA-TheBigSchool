# MEMORY.md - Diario de Estudio

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual

- v1 funcionando: registrar sesiones (fecha, tema, minutos), racha actual y lista de sesiones.
- v1.1: además se muestra la "mejor racha" (máximo histórico de días consecutivos).
- v1.2: además se muestran los minutos totales de la semana en curso.
- v1.3: además se muestran los días únicos estudiados en el mes en curso.
- v1.4: además se muestra un mapa de calor de constancia de las últimas 12 semanas.
- v1.5: además se fija un objetivo de minutos por semana (tarjeta "Objetivo semanal" entre la racha y el mapa de calor) y se ve el progreso con barra y "¡Objetivo cumplido!".
- Datos en localStorage: `diario-estudio-sessions` (sesiones) y `diario-estudio-goal` (objetivo).
- Herramientas: `opencode.json` define el MCP local `chrome-devtools` (bajo `mcp.servers`, forma V2) para inspeccionar la web en el navegador.

## Decisiones (y por qué)

- Sin backend ni dependencias: cualquiera debe poder abrirlo con doble clic.
- Fecha editable en el formulario: permite registrar días pasados y ver la racha crecer.
- La mejor racha es el tramo consecutivo más largo del historial, sin la regla "sigue viva" (esa es solo de la racha actual); se conserva al romperse la racha, se calcula en memoria desde las sesiones (no cambia el formato de datos) y se muestra como `max(mejor, actual)` para que nunca parezca menor que la racha actual.
- Fuente única del cálculo de la semana: `countWeekMinutes(sessions, todayISO)` en `logic.js`, derivada de `getWeekStartISO()`/`getWeekEndISO()`. La usan "Esta semana" y el progreso del objetivo, así que coinciden por construcción (se eliminaron `getWeekRange()`/`countWeekMinutes()` de `app.js`).
- Objetivo semanal: una sola cifra recurrente (no por semana ni historial); se guarda como cadena canónica de dígitos `^[1-9][0-9]*$` (p. ej. `"300"`), nunca como número. El formulario es tolerante (normaliza `1e3` → `"1000"`); la lectura es estricta: cualquier valor no canónico (o no cadena, o > `MAX_SAFE_INTEGER`) se trata como "sin objetivo" sin borrarlo.
- La escritura del objetivo va protegida con try/catch (`console.warn`): si `localStorage` no está disponible la app sigue en la sesión actual sin errores en consola.
- La barra usa la fracción exacta pero se limita al 100 %; los minutos mostrados son siempre los reales ("370 de 300") y `aria-valuenow` se topa en el objetivo.
- Sin objetivo no se expone `role="progressbar"` (no hay máximo): el relleno es decorativo (`aria-hidden`) y el estado lo dice el texto "X minutos · Sin objetivo · Fija uno", que es texto simple (no enfocable).
- Contraste medido con DevTools: título/cifras/placeholder/valor 13,84:1, rótulo 5,32:1, botón 13,84:1, "¡Objetivo cumplido!" 10,88:1 (tinta sobre amarillo) y borde de la barra 5,32:1. Solo se reutilizaron colores existentes (`--ink`, `--ink-soft`), sin colores nuevos.
- Semana natural lunes–domingo (ISO/España) y referida a la semana que contiene hoy; es lo que se espera al decir "esta semana".
- Cuentan las sesiones con fecha dentro del rango, incluida una futura de la misma semana: no hay concepto de "planificado" y todo se deriva de los datos.
- Los minutos se muestran con pluralización (`1 minuto` / `125 minutos`) para ser coherentes con la lista.
- El total se muestra dentro de la tarjeta de racha, bajo la mejor racha, sin crear estructura nueva.
- "Días del mes" cuenta días únicos (no sesiones) del mes natural en curso, incluidas fechas futuras del mismo mes (coherente con la semana): reutiliza `getDayKeysSet()` y compara el prefijo `"AAAA-MM"` del mes de hoy.
- Repo git en la rama `main`, con `.gitattributes` (`* text=auto eol=lf`) para evitar el ruido CRLF/LF de Windows. Los commits se agrupan por tandas coherentes (no uno por interacción) y el mensaje resume los agregados y las modificaciones.
- Los tests son la puerta para la lógica pura (`node --test`, incluido en Node, sin instalar paquetes); la verificación manual en el navegador sigue para lo visual.
- La lógica pura (fechas, racha, mes, mapa de calor y objetivo) vive en `logic.js`, sin DOM ni `localStorage`, recibiendo `todayISO`; se prueba en `logic.test.js`.
- Mapa de calor: ventana fija de 12 semanas naturales (lunes–domingo) que termina en la semana de hoy, con umbrales de minutos enteros 0 / 1–29 / 30–59 / 60–119 / ≥120.
- El detalle del día del mapa se muestra por celda (`aria-label` + línea de detalle) con puntero y toque; se renuncia a la navegación por teclado celda a celda para no añadir 84 paradas de tabulador.
- En colores forzados los niveles se distinguen por el trazo (punteado → discontinuo → 2 px → 3 px → relleno): Chrome fuerza `background-image` a `none` y las tramas no se veían.
- En móvil (≤560 px) los tres datos de `.stats` se apilan a una columna con la etiqueta a la izquierda y la cifra a la derecha: en 3 columnas de ~83 px la cifra "135 minutos" se partía en 2 líneas.

## Identidad visual

- Cuaderno de estudio: papel claro, tinta azul-negra, renglones azules, regla roja al margen y subrayador amarillo para la racha.
- Se descartó el diseño anterior (tarjetas oscuras con degradado, etiqueta en mayúsculas, emojis): era el patrón genérico de "SaaS de tarjetas".
- Sin fuentes externas: serif del sistema (Georgia) para títulos/cifras y monoespaciada solo para los minutos.

## Aprendizajes y errores a evitar

- En diseño: evitar emojis, etiquetas en mayúsculas y pilas de tarjetas idénticas con degradado y sombra; reservar un único gesto llamativo.
- Al añadir una cifra derivada del tiempo, no duplicar el cálculo: extraer una función pura compartida (aquí la semana) evita que dos cifras visibles se contradigan; el reloj se lee solo al cargar y al guardar.
- Cuidado con las formas que produce `input type="number"` (p. ej. `1e3`): validar/normalizar antes de persistir para que el valor guardado sea canónico.
- No borrar un dato corrupto al leerlo: tratarlo como ausente y dejar que solo un guardado válido lo sobrescriba.

## Próximos pasos

- Spec 001 "mapa de calor": **completa** y auditada RF por RF (2026-10-17).
- Spec 002 "objetivo semanal": **completa** (T1–T7) y verificada el 2026-10-20 con chrome-devtools: los tres estados (sin objetivo, parcial, cumplido), edición con recálculo y persistencia, valor corrupto tratado sin borrarse, teclado campo→botón con foco de vuelta, contraste medido, consola limpia y 375 px sin desbordes. `node --test` 44/44.
- README.md y LICENSE (Apache 2.0, titular MoureDev) y la captura `assets/captura-movil.png`; la configuración de IA (`.agents/`, `.opencode/`, `opencode.json`, `skills-lock.json`) queda fuera del repo por `.gitignore`. Repositorio en GitHub.
