/**
 * Lógica pura del Diario de Estudio.
 *
 * Sin DOM, sin localStorage y sin consultar el reloj: las funciones que
 * dependen del tiempo reciben "hoy" (todayISO) como parámetro.
 * Se usa igual en el navegador (funciones globales) y en Node (module.exports).
 */

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseISODate(isoDate) {
  if (typeof isoDate !== "string") return null;
  const match = ISO_DATE_PATTERN.exec(isoDate);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function isValidISODate(isoDate) {
  return parseISODate(isoDate) !== null;
}

function addDays(date, days) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() + days);
  return result;
}

function getWeekStartISO(todayISO) {
  const date = parseISODate(todayISO);
  if (!date) return null;
  const offsetToMonday = (date.getDay() + 6) % 7;
  return toISODate(addDays(date, -offsetToMonday));
}

function formatDisplayDate(isoDate) {
  const parts = String(isoDate).split("-");
  if (parts.length !== 3) return isoDate;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

function classifyLevel(minutes) {
  if (minutes >= 120) return 4;
  if (minutes >= 60) return 3;
  if (minutes >= 30) return 2;
  if (minutes >= 1) return 1;
  return 0;
}

function formatMinutes(minutes) {
  return `${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
}

function formatDetail(isoDate, minutes) {
  const date = formatDisplayDate(isoDate);
  if (!minutes) return `${date}, sin estudio`;
  return `${date}, ${formatMinutes(minutes)}`;
}

function minutesByDay(sessions) {
  const totals = {};
  if (!Array.isArray(sessions)) return totals;

  for (const session of sessions) {
    if (!session || typeof session !== "object") continue;
    if (!isValidISODate(session.date)) continue;
    if (!Number.isInteger(session.minutes) || session.minutes < 1) continue;
    totals[session.date] = (totals[session.date] || 0) + session.minutes;
  }

  return totals;
}

function buildHeatMap(sessions, todayISO) {
  const weekStartISO = getWeekStartISO(todayISO);
  if (!weekStartISO) {
    return { startISO: null, endISO: null, weeks: [] };
  }

  const startISO = toISODate(addDays(parseISODate(weekStartISO), -7 * 11));
  const endISO = toISODate(addDays(parseISODate(startISO), 83));
  const totals = minutesByDay(sessions);

  const weeks = [];
  let date = parseISODate(startISO);

  for (let week = 0; week < 12; week += 1) {
    const days = [];
    for (let day = 0; day < 7; day += 1) {
      const iso = toISODate(date);
      const minutes = totals[iso] || 0;
      days.push({ date: iso, minutes, level: classifyLevel(minutes) });
      date = addDays(date, 1);
    }
    weeks.push(days);
  }

  return { startISO, endISO, weeks };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
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
  };
}
