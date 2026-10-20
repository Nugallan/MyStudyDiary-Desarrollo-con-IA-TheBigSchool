const test = require("node:test");
const assert = require("node:assert/strict");

const {
  toISODate,
  parseISODate,
  isValidISODate,
  addDays,
  getWeekStartISO,
  getWeekEndISO,
  formatDisplayDate,
  classifyLevel,
  formatMinutes,
  formatDetail,
  minutesByDay,
  countWeekMinutes,
  buildWeeklyProgress,
  parseGoal,
  formatGoalText,
  formatGoalValueText,
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

// ---------------------------------------------------------------------------
// Objetivo semanal (spec 002): rango de la semana, minutos, progreso y parseo
// ---------------------------------------------------------------------------

test("getWeekEndISO: domingo de la semana de hoy (sabado, lunes y domingo)", () => {
  assert.equal(getWeekEndISO("2026-10-17"), "2026-10-18"); // sabado
  assert.equal(getWeekEndISO("2026-10-12"), "2026-10-18"); // lunes
  assert.equal(getWeekEndISO("2026-10-18"), "2026-10-18"); // domingo
});

test("getWeekEndISO: semana que cruza de año", () => {
  assert.equal(getWeekStartISO("2027-01-01"), "2026-12-28");
  assert.equal(getWeekEndISO("2027-01-01"), "2027-01-03");
});

test("getWeekEndISO: todayISO invalido devuelve null", () => {
  assert.equal(getWeekEndISO("2026-13-45"), null);
});

test("countWeekMinutes: suma solo las sesiones del rango lunes-domingo", () => {
  const todayISO = "2026-10-17"; // sabado; semana 2026-10-12 .. 2026-10-18
  const sessions = [
    { date: "2026-10-12", minutes: 30 }, // lunes: cuenta
    { date: "2026-10-17", minutes: 45 }, // sabado: cuenta
    { date: "2026-10-09", minutes: 60 }, // viernes anterior: no cuenta
    { date: "2026-10-19", minutes: 60 } // lunes siguiente: no cuenta
  ];
  assert.equal(countWeekMinutes(sessions, todayISO), 75);
});

test("countWeekMinutes: una sesion futura dentro de la misma semana cuenta", () => {
  // Rango cerrado en ambos extremos: >= lunes && <= domingo
  const todayISO = "2026-10-17"; // sabado
  const sessions = [{ date: "2026-10-18", minutes: 30 }]; // domingo (futuro), extremo cerrado
  assert.equal(countWeekMinutes(sessions, todayISO), 30);
});

test("countWeekMinutes: fechas y minutos invalidos no cuentan", () => {
  const sessions = [
    { date: "2026-13-45", minutes: 30 },
    { date: "17/10/2026", minutes: 30 },
    { date: "2026-10-16", minutes: 0 },
    { date: "2026-10-16", minutes: -5 },
    { date: "2026-10-16", minutes: 30.5 },
    { date: "2026-10-16", minutes: "30" }
  ];
  assert.equal(countWeekMinutes(sessions, "2026-10-17"), 0);
});

test("countWeekMinutes: mismo total con hoy lunes y hoy domingo", () => {
  const sessions = [
    { date: "2026-10-12", minutes: 30 },
    { date: "2026-10-14", minutes: 20 },
    { date: "2026-10-18", minutes: 10 }
  ];
  assert.equal(countWeekMinutes(sessions, "2026-10-12"), 60);
  assert.equal(countWeekMinutes(sessions, "2026-10-18"), 60);
});

test("buildWeeklyProgress: sin objetivo no inventa cifras", () => {
  const progress = buildWeeklyProgress([{ date: "2026-10-17", minutes: 120 }], null, "2026-10-17");
  assert.equal(progress.minutes, 120);
  assert.equal(progress.goal, null);
  assert.equal(progress.ratio, null);
  assert.equal(progress.cappedRatio, 0);
  assert.equal(progress.done, false);
  assert.equal(progress.percent, null);
});

test("buildWeeklyProgress: sin sesiones y con objetivo, barra vacia", () => {
  const progress = buildWeeklyProgress([], 300, "2026-10-17");
  assert.equal(progress.minutes, 0);
  assert.equal(progress.goal, 300);
  assert.equal(progress.cappedRatio, 0);
  assert.equal(progress.done, false);
  assert.equal(progress.percent, 0);
});

test("buildWeeklyProgress: minutos por debajo del objetivo", () => {
  const progress = buildWeeklyProgress([{ date: "2026-10-17", minutes: 120 }], 300, "2026-10-17");
  assert.equal(progress.minutes, 120);
  assert.equal(progress.cappedRatio, 0.4);
  assert.equal(progress.ratio, 0.4);
  assert.equal(progress.done, false);
  assert.equal(progress.percent, 40);
});

test("buildWeeklyProgress: minutos iguales al objetivo cumplen (umbral inclusivo)", () => {
  const progress = buildWeeklyProgress([{ date: "2026-10-17", minutes: 300 }], 300, "2026-10-17");
  assert.equal(progress.done, true);
  assert.equal(progress.cappedRatio, 1);
  assert.equal(progress.percent, 100);
});

test("buildWeeklyProgress: muy por encima del objetivo, barra llena y minutos reales", () => {
  const progress = buildWeeklyProgress([{ date: "2026-10-17", minutes: 10000 }], 300, "2026-10-17");
  assert.equal(progress.minutes, 10000);
  assert.equal(progress.cappedRatio, 1);
  assert.equal(progress.done, true);
  assert.equal(progress.percent, 100);
  assert.equal(progress.ratio > 1, true);
});

test("buildWeeklyProgress: percent redondeado y limitado a 100", () => {
  assert.equal(
    buildWeeklyProgress([{ date: "2026-10-17", minutes: 200 }], 300, "2026-10-17").percent,
    67
  );
  assert.equal(
    buildWeeklyProgress([{ date: "2026-10-17", minutes: 350 }], 300, "2026-10-17").percent,
    100
  );
});

test("formatGoalText: pluraliza cada cifra por separado", () => {
  assert.equal(formatGoalText(1, 300), "1 minuto de 300 minutos");
  assert.equal(formatGoalText(45, 1), "45 minutos de 1 minuto");
  assert.equal(formatGoalText(350, 300), "350 minutos de 300 minutos");
});

test("formatGoalText: estado sin objetivo", () => {
  assert.equal(formatGoalText(120, null), "120 minutos · Sin objetivo · Fija uno");
});

test("formatGoalValueText: minutos reales aunque el porcentaje este a 100", () => {
  assert.equal(
    formatGoalValueText(buildWeeklyProgress([{ date: "2026-10-17", minutes: 120 }], 300, "2026-10-17")),
    "120 minutos de 300 minutos, 40 %"
  );
  assert.equal(
    formatGoalValueText(buildWeeklyProgress([{ date: "2026-10-17", minutes: 350 }], 300, "2026-10-17")),
    "350 minutos de 300 minutos, 100 %"
  );
});

test("formatGoalValueText: objetivo de 1 minuto pluraliza en singular", () => {
  const progress = buildWeeklyProgress([{ date: "2026-10-17", minutes: 1 }], 1, "2026-10-17");
  assert.equal(formatGoalValueText(progress), "1 minuto de 1 minuto, 100 %");
  assert.equal(progress.done, true);
});

test("parseGoal: acepta cadenas canonicas", () => {
  assert.equal(parseGoal("300"), 300);
  assert.equal(parseGoal("1"), 1);
  assert.equal(parseGoal(String(Number.MAX_SAFE_INTEGER)), Number.MAX_SAFE_INTEGER);
});

test("parseGoal: rechaza formas no canonicas y corruptas", () => {
  for (const rawValue of ["", " 300 ", "300.0", "1e3", "0300", "0", "-5", "abc"]) {
    assert.equal(parseGoal(rawValue), null, `deberia rechazar ${JSON.stringify(rawValue)}`);
  }
});

test("parseGoal: rechaza valores que no son cadenas", () => {
  for (const rawValue of [true, null, {}, 300, undefined]) {
    assert.equal(parseGoal(rawValue), null, `deberia rechazar ${String(rawValue)}`);
  }
});

test("parseGoal: rechaza un entero mayor que MAX_SAFE_INTEGER", () => {
  assert.equal(parseGoal("9007199254740992"), null);
});

test("parseGoal: ida y vuelta del formato canonico", () => {
  assert.equal(parseGoal(String(300)), 300);
});

test("determinismo: misma entrada da el mismo resultado", () => {
  const sessions = [{ date: "2026-10-17", minutes: 45 }];
  assert.deepEqual(
    buildWeeklyProgress(sessions, 300, "2026-10-17"),
    buildWeeklyProgress(sessions, 300, "2026-10-17")
  );
  assert.equal(
    countWeekMinutes(sessions, "2026-10-17"),
    countWeekMinutes(sessions, "2026-10-17")
  );
});

test("rendimiento: countWeekMinutes con 5000 sesiones en menos de 100 ms", () => {
  const sessions = [];
  for (let index = 0; index < 5000; index += 1) {
    const day = String((index % 28) + 1).padStart(2, "0");
    sessions.push({ date: `2026-10-${day}`, minutes: (index % 120) + 1 });
  }

  const startedAt = performance.now();
  const total = countWeekMinutes(sessions, "2026-10-17");
  const elapsed = performance.now() - startedAt;

  assert.equal(total > 0, true);
  assert.equal(elapsed < 100, true, `tardo ${elapsed} ms`);
});
