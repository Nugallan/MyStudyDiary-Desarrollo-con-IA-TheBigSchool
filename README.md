# Diario de Estudio

Web estática para registrar tus sesiones de estudio y ver tu constancia de un vistazo: racha actual, mejor racha, minutos de la semana, días del mes y un mapa de calor de las últimas 12 semanas.

Está hecha con HTML, CSS y JavaScript puros: sin frameworks, sin dependencias y sin paso de compilación. Se abre con doble clic en `index.html`.

## Funcionalidades

- **Registrar sesiones**: fecha, tema y minutos.
- **Racha actual** y **mejor racha** (el tramo más largo del historial).
- **Minutos de la semana** en curso (semana natural de lunes a domingo).
- **Días estudiados del mes** en curso.
- **Mapa de calor de constancia**: las últimas 12 semanas, un día por celda y cinco niveles de intensidad según los minutos del día. Muestra la fecha y los minutos de cada día al pasar el puntero o tocar.
- **Persistencia local**: los datos se guardan en el `localStorage` del navegador.
- **Fechas locales**: todo se calcula en la zona horaria del usuario, nunca en UTC.

## Cómo usarlo

1. Clona o descarga el repositorio.
2. Abre `index.html` en el navegador (doble clic).
3. Añade tu primera sesión.

No hace falta instalar nada ni levantar un servidor.

## Estructura del proyecto

| Archivo | Qué contiene |
|---|---|
| `index.html` | Estructura de la página |
| `styles.css` | Estilos (tema "cuaderno de estudio") |
| `app.js` | Interfaz: formulario, lista, estadísticas y mapa |
| `logic.js` | Lógica pura (fechas, rachas, estadísticas y mapa de calor) |
| `logic.test.js` | Tests de la lógica con el runner de Node |
| `docs/` | Constitución del proyecto |
| `specs/` | Especificaciones, planes y tareas (Spec-Driven Development) |

## Tests

```bash
node --test
```

Usa el runner incluido en Node, así que no hay que instalar paquetes.

## Tecnologías

- HTML5, CSS3 y JavaScript (sin frameworks).
- `localStorage` para guardar los datos.
- Node solo para ejecutar los tests.

## Proceso de desarrollo

El proyecto se desarrolla con **Spec-Driven Development**: primero la especificación (`specs/001-heat-map/spec.md`), después el plan (`plan.md`) y las tareas (`tasks.md`), y por último la implementación, escribiendo los tests antes que el código. Las reglas del proyecto están en `docs/constitution.md` y `AGENTS.md`.

## Autoría y créditos

- Proyecto de práctica del curso **[Curso de Desarrollo con IA: el Nuevo Programador](https://thebigschool.com/sp/curso-desarrollo-ia-nuevo-programador-eg/)** de **MoureDev** (The Big School).
- Autor: **Nugallan**.

## Licencia

Distribuido bajo la licencia [MIT](LICENSE).
