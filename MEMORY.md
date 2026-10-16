# MEMORY.md - Diario de Estudio

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual

- v1 funcionando: registrar sesiones (fecha, tema, minutos), racha actual y lista de sesiones.
- v1.1: además se muestra la "mejor racha" (máximo histórico de días consecutivos).
- v1.2: además se muestran los minutos totales de la semana en curso.
- v1.3: además se muestran los días únicos estudiados en el mes en curso.
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
- La lógica del mapa de calor irá en un `logic.js` puro (sin DOM ni `localStorage`, recibe `todayISO`) para poder probarla con `node --test`; es el único archivo nuevo además de los tests.

## Identidad visual

- Cuaderno de estudio: papel claro, tinta azul-negra, renglones azules, regla roja al margen y subrayador amarillo para la racha.
- Se descartó el diseño anterior (tarjetas oscuras con degradado, etiqueta en mayúsculas, emojis): era el patrón genérico de "SaaS de tarjetas".
- Sin fuentes externas: serif del sistema (Georgia) para títulos/cifras y monoespaciada solo para los minutos.

## Aprendizajes y errores a evitar

- En diseño: evitar emojis, etiquetas en mayúsculas y pilas de tarjetas idénticas con degradado y sombra; reservar un único gesto llamativo.

## Próximos pasos

- Spec 001 "mapa de calor de constancia" (`specs/001-heat-map/spec.md`, revisión 2) y su plan (`specs/001-heat-map/plan.md`) listos; pendiente de aprobación antes de implementar.
- Probado manualmente con chrome-devtools: 3 sesiones consecutivas → racha 3, mejor 3, semana 135 min, mes 3 días, consola limpia y persistencia OK.
- Pendiente: en móvil (375px) los tres datos de `.stats` van en 3 columnas de ~83px y "135 minutos" se parte en 2 líneas; valorar apilar `.stats` a 1 columna en el breakpoint de 560px.
