const test = require("node:test");
const assert = require("node:assert/strict");

const {
  toISODate,
  parseISODate,
  isValidISODate,
  addDays,
  getWeekStartISO,
  formatDisplayDate,
  classifyLevel,
  formatMinutes,
  formatDetail,
  minutesByDay,
  buildHeatMap
} = require("./logic.js");

test("classifyLevel: limites de los cinco niveles", () => {
  assert.equal(classifyLevel(0), 0);
  assert.equal(classifyLevel(1), 1);
  assert.equal(classifyLevel(29), 1);
  assert.equal(classifyLevel(30), 2);
  assert.equal(classifyLevel(59), 2);
  assert.equal(classifyLevel(60), 3);
  assert.equal(classifyLevel(119), 3);
  assert.equal(classifyLevel(120), 4);
  assert.equal(classifyLevel(5000), 4);
});

test("formatMinutes: pluralizacion", () => {
  assert.equal(formatMinutes(1), "1 minuto");
  assert.equal(formatMinutes(45), "45 minutos");
});

test("formatDetail: con minutos y sin estudio", () => {
  assert.equal(formatDetail("2026-10-17", 45), "17/10/2026, 45 minutos");
  assert.equal(formatDetail("2026-10-17", 1), "17/10/2026, 1 minuto");
  assert.equal(formatDetail("2026-10-17", 0), "17/10/2026, sin estudio");
});

test("formatDisplayDate: de AAAA-MM-DD a DD/MM/AAAA", () => {
  assert.equal(formatDisplayDate("2026-10-17"), "17/10/2026");
});

test("parseISODate: ida y vuelta local sin desfase UTC", () => {
  for (const iso of ["2026-01-01", "2026-06-15", "2026-12-31", "2027-03-01"]) {
    assert.equal(toISODate(parseISODate(iso)), iso);
  }
});

test("isValidISODate: acepta validas y rechaza invalidas", () => {
  assert.equal(isValidISODate("2026-10-17"), true);
  assert.equal(isValidISODate("2026-02-29"), false);
  assert.equal(isValidISODate("2026-13-45"), false);
  assert.equal(isValidISODate("17/10/2026"), false);
  assert.equal(isValidISODate(""), false);
  assert.equal(isValidISODate(null), false);
});

test("addDays: suma y resta sin milisegundos", () => {
  assert.equal(toISODate(addDays(parseISODate("2026-10-17"), 1)), "2026-10-18");
  assert.equal(toISODate(addDays(parseISODate("2026-10-17"), -17)), "2026-09-30");
  assert.equal(toISODate(addDays(parseISODate("2027-01-01"), -1)), "2026-12-31");
});

test("getWeekStartISO: lunes de la semana de hoy", () => {
  assert.equal(getWeekStartISO("2026-10-17"), "2026-10-12"); // sabado
  assert.equal(getWeekStartISO("2026-10-12"), "2026-10-12"); // lunes
  assert.equal(getWeekStartISO("2026-10-18"), "2026-10-12"); // domingo
  assert.equal(getWeekStartISO("2026-13-45"), null);
});

test("minutesByDay: suma varias sesiones del mismo dia", () => {
  const totals = minutesByDay([
    { date: "2026-10-17", minutes: 20 },
    { date: "2026-10-17", minutes: 25 },
    { date: "2026-10-16", minutes: 10 }
  ]);
  assert.equal(totals["2026-10-17"], 45);
  assert.equal(totals["2026-10-16"], 10);
});

test("minutesByDay: ignora fechas y minutos invalidos", () => {
  const totals = minutesByDay([
    { date: "2026-13-45", minutes: 30 },
    { date: "17/10/2026", minutes: 30 },
    { date: "2026-10-16", minutes: 0 },
    { date: "2026-10-16", minutes: -5 },
    { date: "2026-10-16", minutes: 30.5 },
    { date: "2026-10-16", minutes: "30" },
    { date: null, minutes: 30 },
    null
  ]);
  assert.deepEqual(totals, {});
});

test("buildHeatMap: 84 celdas en 12 semanas de 7 dias", () => {
  const map = buildHeatMap([], "2026-10-17");
  assert.equal(map.weeks.length, 12);
  for (const week of map.weeks) {
    assert.equal(week.length, 7);
  }
  assert.equal(map.weeks.flat().length, 84);
});

test("buildHeatMap: primera y ultima celda de la ventana", () => {
  const map = buildHeatMap([], "2026-10-17");
  assert.equal(map.startISO, "2026-07-27");
  assert.equal(map.endISO, "2026-10-18");
  assert.equal(map.weeks[0][0].date, "2026-07-27");
  assert.equal(map.weeks[11][6].date, "2026-10-18");
});

test("buildHeatMap: hoy en lunes o en domingo da la misma semana actual", () => {
  const monday = buildHeatMap([], "2026-10-12");
  const sunday = buildHeatMap([], "2026-10-18");
  assert.equal(monday.weeks[11][6].date, "2026-10-18");
  assert.equal(sunday.weeks[11][6].date, "2026-10-18");
  assert.equal(monday.startISO, "2026-07-27");
  assert.equal(sunday.startISO, "2026-07-27");
});

test("buildHeatMap: la ventana cruza de año", () => {
  const map = buildHeatMap([], "2027-01-05");
  assert.equal(map.startISO, "2026-10-19");
  assert.equal(map.weeks[11][6].date, "2027-01-10");
});

test("buildHeatMap: suma varias sesiones del mismo dia", () => {
  const map = buildHeatMap(
    [
      { date: "2026-10-17", minutes: 20 },
      { date: "2026-10-17", minutes: 25 }
    ],
    "2026-10-17"
  );
  const cell = map.weeks.flat().find((c) => c.date === "2026-10-17");
  assert.equal(cell.minutes, 45);
  assert.equal(cell.level, 2);
});

test("buildHeatMap: dia sin sesiones y dia con 0 minutos son nivel 0", () => {
  const map = buildHeatMap([{ date: "2026-10-16", minutes: 0 }], "2026-10-17");
  const empty = map.weeks.flat().find((c) => c.date === "2026-10-15");
  const zero = map.weeks.flat().find((c) => c.date === "2026-10-16");
  assert.equal(empty.minutes, 0);
  assert.equal(empty.level, 0);
  assert.equal(zero.minutes, 0);
  assert.equal(zero.level, 0);
});

test("buildHeatMap: una sesion futura dentro de la semana se colorea", () => {
  const map = buildHeatMap([{ date: "2026-10-18", minutes: 30 }], "2026-10-17");
  const cell = map.weeks.flat().find((c) => c.date === "2026-10-18");
  assert.equal(cell.minutes, 30);
  assert.equal(cell.level, 2);
});

test("buildHeatMap: las sesiones fuera de la ventana no aparecen", () => {
  const map = buildHeatMap(
    [
      { date: "2026-07-26", minutes: 90 },
      { date: "2026-10-19", minutes: 90 }
    ],
    "2026-10-17"
  );
  const dates = map.weeks.flat().map((c) => c.date);
  assert.equal(dates.includes("2026-07-26"), false);
  assert.equal(dates.includes("2026-10-19"), false);
  assert.equal(map.weeks.flat().every((c) => c.level === 0), true);
});

test("buildHeatMap: un dia con muchos minutos es nivel maximo", () => {
  const map = buildHeatMap([{ date: "2026-10-17", minutes: 100000 }], "2026-10-17");
  const cell = map.weeks.flat().find((c) => c.date === "2026-10-17");
  assert.equal(cell.minutes, 100000);
  assert.equal(cell.level, 4);
});

test("buildHeatMap: es determinista con la misma entrada", () => {
  const sessions = [{ date: "2026-10-17", minutes: 45 }];
  assert.deepEqual(buildHeatMap(sessions, "2026-10-17"), buildHeatMap(sessions, "2026-10-17"));
});
