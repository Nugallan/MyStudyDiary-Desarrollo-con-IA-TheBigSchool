# Spec 001 - Mapa de calor de constancia

- Estado: listo para revisión (revisión 2)
- Fecha: 2026-10-17
- Revisión 2: resuelve las ambigüedades, contradicciones y casos límite detectados en el repaso QA. Todas las decisiones quedan en la sección 9 y no queda ninguna duda abierta.

## 1. Contexto y objetivo

El Diario de Estudio ya registra sesiones y muestra la racha actual, la mejor racha, los minutos de la semana y los días del mes. Todas esas cifras miran al presente o a un máximo histórico, pero ninguna deja ver **la constancia a lo largo del tiempo de un vistazo**. El objetivo es añadir un mapa de calor tipo GitHub que muestre los días de las últimas 12 semanas, donde un día con más minutos estudiados se pinta con un color más intenso.

El porqué: ver el patrón de semanas (huecos, rachas, fines de semana flojos) motiva a mantener el hábito mejor que un único número.

## 2. Usuarios

- Persona que estudia por su cuenta (público del proyecto, posible principiante en programación).
- Uso individual: una sola persona, un solo navegador. No hay cuentas, usuarios múltiples ni sincronización.

## 3. Historias de usuario

- HU-1: Como estudiante, quiero ver de un vistazo mi constancia de las últimas 12 semanas para saber si mantengo el hábito.
- HU-2: Como estudiante, quiero distinguir los días que estudié más para reconocer patrones (por ejemplo, fines de semana flojos).
- HU-3: Como estudiante, quiero consultar la fecha y los minutos exactos de un día concreto para recordar qué hice.
- HU-4: Como estudiante, quiero que el mapa se actualice al registrar una sesión para ver mi progreso al momento.

## 4. Requisitos funcionales

Notación EARS usada: **(Ubicuo)** siempre, **(Evento)** cuando ocurre algo, **(Estado)** mientras se da una condición, **(Condición)** si se cumple algo.

**RF-1 - Ubicación del mapa.**
- (Ubicuo) El sistema debe mostrar el mapa en la página principal, en una sección propia situada entre las estadísticas actuales (racha, mejor racha, minutos de la semana y días del mes) y el formulario de registro.

**RF-2 - Ventana de 12 semanas.**
- (Ubicuo) El sistema debe mostrar siempre 84 celdas: 7 filas (lunes a domingo) por 12 columnas (una por semana).
- (Evento) Cuando se abre o se recarga la página, la última columna debe corresponder a la semana natural (lunes–domingo) que contiene la fecha actual, y la primera a la de 11 semanas antes.
- Criterio: la primera celda es el lunes de hace 11 semanas y la última es el domingo de la semana actual; las celdas posteriores a hoy incluidas en la semana actual se muestran igual que cualquier día sin minutos (RF-5).

**RF-3 - Un día, una celda.**
- (Ubicuo) El sistema debe representar con exactamente una celda cada fecha local comprendida en la ventana.
- (Evento) Cuando varias sesiones comparten la misma fecha, la celda debe reflejar la suma de sus minutos.
- Criterio: dos sesiones de 20 y 25 minutos el mismo día producen una celda de 55 minutos.

**RF-4 - Intensidad por umbrales fijos.**
- (Ubicuo) El sistema debe clasificar cada día en uno de cinco niveles según sus minutos totales (número entero ≥ 0):
  - nivel 0 "sin estudio": 0 minutos
  - nivel 1 "ligero": 1–29 minutos
  - nivel 2 "medio": 30–59 minutos
  - nivel 3 "alto": 60–119 minutos
  - nivel 4 "intenso": ≥ 120 minutos
- (Estado) Mientras el total de un día esté en un rango, la celda debe usar el nivel correspondiente.
- Criterio: 0→nivel 0, 1→1, 29→1, 30→2, 59→2, 60→3, 119→3, 120→4 y cualquier valor mayor→4.

**RF-5 - Días sin minutos.**
- (Ubicuo) El sistema debe mostrar con el nivel 0 "sin estudio" los días cuyo total sea 0 minutos, tengan o no sesiones registradas.

**RF-6 - Detalle de un día.**
- (Evento) Cuando la persona sitúa el puntero sobre una celda o la toca, el sistema debe mostrar, junto al mapa, la fecha local en formato DD/MM/AAAA y los minutos totales (por ejemplo, "45 minutos").
- (Condición) Si ese día tiene 0 minutos, entonces debe mostrar "Sin estudio".
- (Evento) Cuando la persona toca otra celda, el detalle debe actualizarse; si toca fuera del mapa, el detalle debe ocultarse.
- Los minutos se muestran con la misma pluralización que en el resto de la app ("1 minuto" / "45 minutos").

**RF-7 - Leyenda.**
- (Ubicuo) El sistema debe mostrar una leyenda con los cinco niveles, cada uno con su rango de minutos, ordenados de "menos" a "más" e incluyendo "sin estudio (0 minutos)".

**RF-8 - Fechas futuras dentro de la ventana.**
- (Ubicuo) El sistema debe tratar las sesiones con fecha futura comprendida en la ventana igual que las de fechas pasadas, igual que hacen "minutos de la semana" y "días del mes": su celda refleja los minutos.

**RF-9 - Sesiones fuera de la ventana.**
- (Condición) Si una sesión tiene una fecha anterior al inicio de la ventana (más de 11 semanas) o posterior al fin de la ventana (después del domingo de la semana actual), entonces no debe afectar al mapa.

**RF-10 - Actualización.**
- (Evento) Cuando se guarda una sesión correctamente, el mapa debe actualizarse sin recargar la página, tomando como "hoy" la fecha del momento.
- (Condición) Si el formulario no supera la validación, entonces el mapa no debe cambiar.
- (Ubicuo) Fuera de la carga y del guardado, el mapa no debe recalcularse por sí solo: si la página queda abierta cruzando la medianoche, mantiene la referencia hasta la siguiente recarga o guardado.

**RF-11 - Solo lectura.**
- (Ubicuo) El sistema debe calcular el mapa únicamente a partir de las sesiones ya guardadas y nunca debe crear, escribir ni modificar información guardada.

**RF-12 - Datos inválidos.**
- (Condición) Si una sesión tiene una fecha que no es válida en formato local `YYYY-MM-DD` o unos minutos que no son un número entero ≥ 1, entonces no debe afectar al mapa ni provocar errores en él.

## 5. Requisitos no funcionales

- RNF-1: Sin dependencias ni build nuevos; se sigue abriendo con doble clic (Constitución 1).
- RNF-2: Todas las fechas del mapa se calculan en la zona horaria local del usuario, nunca en UTC (coherente con racha, semana y mes).
- RNF-3: Textos visibles en español; código en inglés (Constitución 6).
- RNF-4: Accesibilidad:
  - El color no puede ser la única información: cada celda debe tener un nombre accesible con su fecha y, si procede, sus minutos (por ejemplo, "17/10/2026, 45 minutos" o "17/10/2026, sin estudio").
  - El orden de lectura debe ser el de la rejilla (semana a semana y, dentro de cada semana, de lunes a domingo).
  - Las celdas no deben añadir paradas al recorrido del tabulador.
  - El texto de la leyenda debe tener una relación de contraste de al menos 4.5:1 (WCAG AA).
  - Los cinco niveles deben seguir distinguiéndose en escala de grises y con colores forzados o de alto contraste.
- RNF-5: Rendimiento: el mapa debe recalcularse en menos de 100 ms con hasta 5.000 sesiones.
- RNF-6: Tests: la lógica del mapa (cálculo de la ventana, recuento de minutos por día y clasificación en niveles) debe cubrirse con tests automáticos ejecutables sin instalar paquetes; no se avanza con tests en rojo (Constitución 4).
- RNF-7: Determinismo: el cálculo del mapa debe depender solo de las sesiones y de una fecha "hoy" recibida como entrada, sin consultar el reloj por su cuenta (Constitución 3).
- RNF-8: Responsive: usable a 375 px de ancho sin desbordamiento horizontal.

## 6. Casos límite

- Sin ninguna sesión: el mapa muestra 84 celdas en nivel 0 y la leyenda; no es un estado de error.
- Información guardada ausente, corrupta o almacenamiento no disponible: el mapa se muestra vacío y no modifica nada.
- Una sesión con minutos o fechas inválidos: se ignora esa sesión (RF-12) y el resto se dibuja con normalidad.
- Sesión justo en el lunes inicial o en el domingo final de la ventana: entra en el mapa (extremos inclusivos).
- Sesión fuera de la ventana (anterior o posterior): no aparece.
- Varias sesiones el mismo día: se suman.
- Sesión con 0 minutos (dato corrupto): el día se muestra en nivel 0 (RF-5).
- Sesiones con fecha futura dentro de la semana actual: se colorean igual que las pasadas.
- Sesión con fecha futura más allá del domingo de la semana actual: fuera del mapa (RF-9).
- Totales muy altos (por ejemplo, 100.000 minutos): nivel 4 y el detalle muestra el número completo.
- Cambio de semana, de mes o de año y cambio de hora (horario de verano/invierno): las fechas se calculan en local, sin aritmética de milisegundos.
- Cruce de medianoche con la página abierta: el mapa no se reancla hasta la siguiente recarga o guardado (RF-10).
- "Hoy" en lunes (casi toda la semana actual es futura) o en domingo (semana completa): la ventana sigue teniendo 84 celdas.

## 7. Fuera de alcance

- Filtrar por tema o materia.
- Crear o editar sesiones desde el mapa.
- Vista anual o por meses, o rango configurable: la ventana es fija de 12 semanas.
- Etiquetas de mes o de día de la semana alrededor de la rejilla.
- Objetivos diarios, metas o medallas.
- Comparativas entre personas, exportar o importar datos.
- Animaciones y personalización de colores.
- Navegación por teclado celda a celda (patrón de tabulador móvil): el detalle se ofrece con el puntero y con el toque, y cada celda tiene nombre accesible.

## 8. Criterios de finalización

- Todos los RF cumplidos y verificables con sus criterios.
- Lógica del mapa cubierta por tests automáticos en verde, sin paquetes instalados.
- Verificación manual con el MCP de Chrome DevTools: sin errores en consola y vista de 375 px sin desbordes; probados al menos los casos: sin datos, un día de nivel máximo y un día futuro con sesión.
- Sin dependencias ni build nuevos; se abre con doble clic.
- `AGENTS.md` y `MEMORY.md` actualizados; textos en español.

## 9. Decisiones (revisión 2)

- Ubicación: entre las estadísticas y el formulario de registro.
- Ventana fija de 12 semanas (lunes–domingo), terminando en la semana que contiene hoy; no configurable.
- Intensidad por umbrales fijos de minutos enteros: 0 / 1–29 / 30–59 / 60–119 / ≥120.
- Nivel 0 = 0 minutos, haya o no sesión registrada.
- El total del día es la suma de los minutos de todas sus sesiones.
- Detalle con el puntero y con el toque; sin estilo propio para los días futuros (un día sin minutos se ve igual sea pasado o futuro).
- Las celdas no son paradas de tabulador (se evitan 84 paradas de foco); la navegación por teclado celda a celda queda fuera de alcance y el detalle se da por puntero, toque y nombre accesible.
- Las sesiones fuera de la ventana, pasadas o futuras, no se muestran.
- El mapa es de solo lectura: nunca modifica la información guardada.
- El cálculo es determinista y recibe "hoy" como entrada (Constitución 3); se prueba sin instalar paquetes (Constitución 4).
- "Hoy" se reancla solo al cargar/recargar y al guardar una sesión; no hay temporizadores.
- Sin etiquetas de mes ni de día de la semana en esta versión.

## 10. Dudas abiertas

Ninguna pendiente: todas las decisiones se han tomado en la revisión 2 (sección 9).
