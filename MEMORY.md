# MEMORY.md - Diario de Estudio

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual

- v1 funcionando: registrar sesiones (fecha, tema, minutos), racha actual y lista de sesiones.
- v1.1: además se muestra la "mejor racha" (máximo histórico de días consecutivos).
- v1.2: además se muestran los minutos totales de la semana en curso.
- v1.3: además se muestran los días únicos estudiados en el mes en curso.
- v1.4: además se muestra un mapa de calor de constancia de las últimas 12 semanas.
- Datos en localStorage.
- Herramientas: `opencode.json` define el MCP local `chrome-devtools` (bajo `mcp.servers`, forma V2) para inspeccionar la web en el navegador.

## Decisiones (y por qué)

- Sin backend ni dependencias: cualquiera debe poder abrirlo con doble clic.
- Fecha editable en el formulario: permite registrar días pasados y ver la racha crecer.
- La mejor racha es el tramo consecutivo más largo del historial, sin la regla "sigue viva" (esa es solo de la racha actual). Se conserva al romperse la racha.
- La mejor racha se muestra como `max(mejor, actual)` para que nunca parezca menor que la racha actual.
- La mejor racha se calcula en memoria desde las sesiones: no cambia el formato de datos guardados.
- Semana natural lunes–domingo (ISO/España) y referida a la semana que contiene hoy; es lo que se espera al decir "esta semana".
- Cuentan las sesiones con fecha dentro del rango, incluida una futura de la misma semana: no hay concepto de "planificado" y todo se deriva de los datos.
- Los minutos se muestran con pluralización (`1 minuto` / `125 minutos`) para ser coherentes con la lista.
- El total se muestra dentro de la tarjeta de racha, bajo la mejor racha, sin crear estructura nueva.
- "Días del mes" cuenta días únicos (no sesiones): reutiliza `getDayKeysSet()` y compara el prefijo `"AAAA-MM"` del mes de hoy; así dos sesiones el mismo día cuentan una vez.
- Mes natural en curso (del 1 al último día del mes de hoy), incluidas fechas futuras del mismo mes, por coherencia con la semana.
- Repo git en la rama `main`, con `.gitattributes` (`* text=auto eol=lf`) para evitar el ruido CRLF/LF de Windows.
- Los tests son la puerta para la lógica pura (`node --test`, incluido en Node, sin instalar paquetes); la verificación manual en el navegador sigue para lo visual.
- La lógica del mapa de calor vive en `logic.js` puro (sin DOM ni `localStorage`, recibe `todayISO`) y se prueba en `logic.test.js` (`node --test`); es el único archivo nuevo además de los tests.
- Mapa de calor: ventana fija de 12 semanas naturales (lunes–domingo) que termina en la semana de hoy, con umbrales de minutos enteros 0 / 1–29 / 30–59 / 60–119 / ≥120; reglas fáciles de explicar y de testear, sin configuración.
- El detalle del día se muestra por celda (`aria-label` + línea de detalle) con puntero y toque; se renuncia a la navegación por teclado celda a celda para no añadir 84 paradas de tabulador.
- En colores forzados los niveles se distinguen por el trazo (punteado → discontinuo → 2 px → 3 px → relleno): Chrome fuerza `background-image` a `none` y las tramas no se veían.
- En móvil (≤560 px) los tres datos de `.stats` se apilan a una columna con la etiqueta a la izquierda y la cifra a la derecha: en 3 columnas de ~83 px la cifra "135 minutos" se partía en 2 líneas.

## Identidad visual

- Cuaderno de estudio: papel claro, tinta azul-negra, renglones azules, regla roja al margen y subrayador amarillo para la racha.
- Se descartó el diseño anterior (tarjetas oscuras con degradado, etiqueta en mayúsculas, emojis): era el patrón genérico de "SaaS de tarjetas".
- Sin fuentes externas: serif del sistema (Georgia) para títulos/cifras y monoespaciada solo para los minutos.

## Aprendizajes y errores a evitar

- En diseño: evitar emojis, etiquetas en mayúsculas y pilas de tarjetas idénticas con degradado y sombra; reservar un único gesto llamativo.

## Próximos pasos

- Spec 001 "mapa de calor": **completa** (T1–T6) y auditada RF por RF el 2026-10-17: todo cumplido; único hueco, la leyenda no decía "sin estudio (0 min)", ya corregido. `node --test` 20/20; verificado con chrome-devtools (84 celdas, niveles, detalle, consola limpia, 375 px sin desbordes).
- Arreglado el apretado de `.stats` en móvil: a 375 px una columna, las tres cifras en una línea y sin desbordes (a 1280 px sigue en 3 columnas).
- README.md y LICENSE (Apache 2.0, titular MoureDev) listos para publicar; la configuración de IA (`.agents/`, `.opencode/`, `opencode.json`, `skills-lock.json`) queda fuera del repo por `.gitignore`. Pendiente: crear el repositorio en GitHub y añadir el remoto (todavía no hay ninguno).
