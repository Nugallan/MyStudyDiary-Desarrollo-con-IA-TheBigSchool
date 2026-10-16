# MEMORY.md - Diario de Estudio

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual

- v1 funcionando: registrar sesiones (fecha, tema, minutos), racha actual y lista de sesiones.
- v1.1: además se muestra la "mejor racha" (máximo histórico de días consecutivos).
- v1.2: además se muestran los minutos totales de la semana en curso.
- Datos en localStorage.

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

## Aprendizajes y errores a evitar

- (vacío por ahora)

## Próximos pasos

- (vacío por ahora)
