# Spec 001 - Mapa de calor de constancia

- Estado: borrador para revisión
- Fecha: 2026-10-17

## 1. Contexto y objetivo

El Diario de Estudio ya registra sesiones y muestra la racha actual, la mejor racha, los minutos de la semana y los días del mes. Todas esas cifras miran al presente o a un máximo histórico, pero ninguna deja ver **la constancia a lo largo del tiempo de un vistazo**. El objetivo es añadir un mapa de calor tipo GitHub que muestre los días estudiados de las últimas 12 semanas, donde un día con más minutos estudiados se pinta con un color más intenso.

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
- (Ubicuo) El sistema debe mostrar el mapa en la página principal, en una sección propia situada justo después de las estadísticas actuales (racha, mejor racha, minutos de la semana y días del mes).

**RF-2 - Ventana de 12 semanas.**
- (Ubicuo) El sistema debe mostrar 84 celdas: 7 filas (lunes a domingo) por 12 columnas (una por semana).
- (Evento) Cuando se abre o se recarga la aplicación, la última columna debe corresponder a la semana natural (lunes–domingo) que contiene la fecha actual.
- Criterio: la primera celda es el lunes de la semana actual menos 11 semanas y la última es el domingo de la semana actual.

**RF-3 - Un día, una celda.**
- (Ubicuo) El sistema debe representar cada fecha local con exactamente una celda.
- (Evento) Cuando varias sesiones comparten la misma fecha, la celda debe reflejar la suma de sus minutos.
- Criterio: dos sesiones de 20 y 25 minutos el mismo día producen una celda de 55 minutos.

**RF-4 - Intensidad por umbrales fijos.**
- (Ubicuo) El sistema debe clasificar cada día en uno de cinco niveles según sus minutos totales: sin estudio (0), ligero (1–29), medio (30–59), alto (60–119) e intenso (≥120).
- (Estado) Mientras el total de un día esté en un rango, la celda debe mostrar el nivel correspondiente.
- Criterio: 0→nivel 0, 29→nivel 1, 45→nivel 2, 90→nivel 3, 150→nivel 4.

**RF-5 - Días sin estudio.**
- (Ubicuo) El sistema debe mostrar los días sin sesiones con el nivel "sin estudio" (nivel 0).

**RF-6 - Detalle de un día.**
- (Evento) Cuando la persona sitúa el puntero sobre una celda, el sistema debe mostrar la fecha local en formato DD/MM/AAAA y los minutos totales (por ejemplo, "45 minutos").
- (Condición) Si ese día no tiene minutos, entonces debe mostrar "Sin estudio".

**RF-7 - Leyenda.**
- (Ubicuo) El sistema debe mostrar una leyenda con los cinco niveles, de "menos" a "más", indicando el rango de minutos que representa cada uno.

**RF-8 - Días posteriores a hoy.**
- (Estado) Mientras una fecha pertenezca a la semana actual y sea posterior a hoy, el sistema debe mostrarla vacía y no contarla como estudiada.
- (Condición) Si existe una sesión cuya fecha esté dentro de la ventana, entonces la celda debe reflejar sus minutos aunque la fecha sea posterior a hoy (igual que hacen "minutos de la semana" y "días del mes").

**RF-9 - Sesiones fuera de la ventana.**
- (Condición) Si una sesión tiene una fecha anterior al inicio de la ventana, entonces no debe afectar al mapa.

**RF-10 - Actualización inmediata.**
- (Evento) Cuando se guarda una sesión correctamente, el mapa debe actualizarse sin recargar la página.
- (Condición) Si el formulario no supera la validación, entonces el mapa no debe cambiar.

**RF-11 - Datos existentes.**
- (Ubicuo) El sistema debe calcular el mapa a partir de las sesiones ya registradas, sin crear ni modificar la información guardada.

## 5. Requisitos no funcionales

- RNF-1: Sin dependencias ni build nuevos; se sigue abriendo con doble clic (Constitución 1).
- RNF-2: Todas las fechas del mapa se calculan en la zona horaria local del usuario, nunca en UTC (coherente con racha, semana y mes).
- RNF-3: Textos visibles en español; código en inglés (Constitución 6).
- RNF-4: Accesibilidad: el color no puede ser la única información; cada celda debe tener un nombre accesible con su fecha y minutos, la leyenda debe ser legible y los cinco niveles deben tener contraste suficiente.
- RNF-5: Con cientos de sesiones, el mapa debe mostrarse sin demora perceptible.
- RNF-6: La lógica del mapa debe cubrirse con tests automáticos sin instalar paquetes (Constitución 4); no se avanza con tests en rojo.
- RNF-7: Responsive: usable a 375 px de ancho sin desbordamiento horizontal.

## 6. Casos límite

- Sin ninguna sesión: el mapa muestra 84 celdas vacías y la leyenda; no es un estado de error.
- Información guardada ausente o corrupta: se trata como "sin sesiones".
- Minutos inválidos (≤0 o no numéricos): no se cuentan (ya se validan al guardar).
- Sesión justo en el lunes inicial o en el domingo final de la ventana: entra en el mapa (extremos inclusivos).
- Varias sesiones el mismo día: se suman.
- Fechas futuras dentro de la semana actual: vacías salvo que exista una sesión con esa fecha.
- Sesiones muy antiguas (antes de la ventana): no aparecen.
- Cambio de semana, de mes o de año y cambio de hora (horario de verano/invierno): las fechas se calculan en local, sin aritmética de milisegundos.
- Un día en el nivel máximo junto a días vacíos: la leyenda permite interpretarlos.

## 7. Fuera de alcance

- Filtrar por tema o materia.
- Crear o editar sesiones desde el mapa.
- Vista anual, vista por meses o rango configurable por la persona.
- Objetivos diarios, metas o medallas.
- Comparativas entre personas, exportar o importar datos.
- Animaciones y personalización de colores.
- Detalle en móvil más allá de lo indicado en RF-6 (ver dudas abiertas).

## 8. Criterios de finalización

- Todos los RF cumplidos y verificables con sus criterios.
- Lógica del mapa cubierta por tests automáticos en verde, sin paquetes instalados.
- Verificación manual con el MCP de Chrome DevTools: sin errores en consola y vista móvil (375 px) sin desbordes.
- Sin dependencias ni build nuevos; se abre con doble clic.
- `AGENTS.md` y `MEMORY.md` actualizados; textos en español.

## 9. Decisiones tomadas (para revisar)

- Ventana fija de 12 semanas (lunes–domingo), terminando en la semana que contiene hoy.
- Intensidad por umbrales fijos en minutos (5 niveles), no relativa al máximo ni a un objetivo.
- El mapa se coloca tras las estadísticas, en una sección propia.
- El total del día es la suma de los minutos de todas sus sesiones.

## 10. Dudas abiertas

- [NECESITA ACLARACIÓN] ¿El mapa debe mostrar el detalle al **tocar** una celda en móvil (donde no hay puntero), o basta con la leyenda y el nombre accesible?
- [NECESITA ACLARACIÓN] ¿12 semanas es el alcance definitivo o se prevé que sea ajustable más adelante?
- [NECESITA ACLARACIÓN] ¿Los cinco umbrales (0 / 1–29 / 30–59 / 60–119 / ≥120) son los deseados?
- [NECESITA ACLARACIÓN] ¿El mapa debe poder recorrerse con **teclado** (foco por celda) o es suficiente con el detalle al puntero y los nombres accesibles?
