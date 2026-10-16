const STORAGE_KEY = "diario-estudio-sessions";

const form = document.getElementById("sessionForm");
const dateInput = document.getElementById("dateInput");
const topicInput = document.getElementById("topicInput");
const minutesInput = document.getElementById("minutesInput");
const streakCountEl = document.getElementById("streakCount");
const bestStreakCountEl = document.getElementById("bestStreakCount");
const weekMinutesEl = document.getElementById("weekMinutes");
const monthDaysEl = document.getElementById("monthDays");
const sessionsListEl = document.getElementById("sessionsList");
const emptyStateEl = document.getElementById("emptyState");
const heatmapEl = document.getElementById("heatmap");
const heatmapDetailEl = document.getElementById("heatmapDetail");

let sessions = [];

function getTodayISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function setDefaultDate() {
  dateInput.value = getTodayISO();
}

function loadSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (error) {
    console.warn("No se han podido cargar las sesiones guardadas", error);
    return [];
  }
}

function saveSessions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function addSession(isoDate, topic, minutes) {
  const trimmedTopic = topic.trim();
  const entry = {
    id: Date.now(),
    date: isoDate,
    topic: trimmedTopic,
    minutes: Number(minutes),
    createdAt: Date.now()
  };
  sessions.push(entry);
  saveSessions();
}

function sortSessionsDesc() {
  sessions.sort((a, b) => {
    if (b.date !== a.date) {
      return b.date.localeCompare(a.date);
    }
    return b.createdAt - a.createdAt;
  });
}

function renderSessions() {
  sortSessionsDesc();
  sessionsListEl.innerHTML = "";

  if (sessions.length === 0) {
    emptyStateEl.classList.remove("hidden");
    return;
  }

  emptyStateEl.classList.add("hidden");

  for (const session of sessions) {
    const item = document.createElement("li");
    item.className = "session-item";

    const header = document.createElement("div");
    header.className = "session-header";

    const dateEl = document.createElement("span");
    dateEl.className = "session-date";
    dateEl.textContent = formatDisplayDate(session.date);

    const minutesEl = document.createElement("span");
    minutesEl.className = "session-minutes";
    minutesEl.textContent = formatMinutes(session.minutes);

    header.appendChild(dateEl);
    header.appendChild(minutesEl);

    const topicEl = document.createElement("p");
    topicEl.className = "session-topic";
    topicEl.textContent = session.topic;

    item.appendChild(header);
    item.appendChild(topicEl);
    sessionsListEl.appendChild(item);
  }
}

function getDayKeysSet() {
  const set = new Set();
  for (const session of sessions) {
    set.add(session.date);
  }
  return set;
}

function countStreak() {
  const studiedDays = getDayKeysSet();
  if (studiedDays.size === 0) return 0;

  const todayISO = getTodayISO();
  let anchorISO = todayISO;

  if (!studiedDays.has(todayISO)) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, "0");
    const day = String(yesterday.getDate()).padStart(2, "0");
    const yesterdayISO = `${year}-${month}-${day}`;
    if (!studiedDays.has(yesterdayISO)) {
      return 0;
    }
    anchorISO = yesterdayISO;
  }

  let streak = 0;
  let current = new Date(anchorISO + "T00:00:00");
  while (true) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");
    const key = `${year}-${month}-${day}`;
    if (studiedDays.has(key)) {
      streak += 1;
      current.setDate(current.getDate() - 1);
      continue;
    }
    break;
  }

  return streak;
}

function countBestStreak() {
  const studiedDays = getDayKeysSet();
  if (studiedDays.size === 0) return 0;

  const sortedDays = Array.from(studiedDays).sort();

  let best = 0;
  let currentRun = 0;
  let previousDay = null;

  for (const day of sortedDays) {
    if (previousDay !== null) {
      const expected = new Date(previousDay + "T00:00:00");
      expected.setDate(expected.getDate() + 1);
      const year = expected.getFullYear();
      const month = String(expected.getMonth() + 1).padStart(2, "0");
      const dayOfMonth = String(expected.getDate()).padStart(2, "0");
      const expectedISO = `${year}-${month}-${dayOfMonth}`;

      if (day === expectedISO) {
        currentRun += 1;
      } else {
        currentRun = 1;
      }
    } else {
      currentRun = 1;
    }

    if (currentRun > best) {
      best = currentRun;
    }

    previousDay = day;
  }

  return best;
}

function getWeekRange() {
  const now = new Date();
  const offsetToMonday = (now.getDay() + 6) % 7;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offsetToMonday);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  return { startISO: toISODate(start), endISO: toISODate(end) };
}

function countWeekMinutes() {
  const { startISO, endISO } = getWeekRange();
  let total = 0;
  for (const session of sessions) {
    if (session.date >= startISO && session.date <= endISO) {
      total += Number(session.minutes) || 0;
    }
  }
  return total;
}

function updateWeekTotal() {
  const total = countWeekMinutes();
  weekMinutesEl.textContent = `${total} ${total === 1 ? "minuto" : "minutos"}`;
}

function getCurrentMonthPrefix() {
  return getTodayISO().slice(0, 7);
}

function countMonthDays() {
  const prefix = getCurrentMonthPrefix();
  let count = 0;
  for (const day of getDayKeysSet()) {
    if (day.startsWith(prefix)) {
      count += 1;
    }
  }
  return count;
}

function updateMonthDays() {
  const count = countMonthDays();
  monthDaysEl.textContent = `${count} ${count === 1 ? "día" : "días"}`;
}

function renderHeatMap() {
  const heatMap = buildHeatMap(sessions, getTodayISO());
  heatmapEl.innerHTML = "";

  for (const week of heatMap.weeks) {
    const weekEl = document.createElement("div");
    weekEl.className = "heat-week";

    for (const day of week) {
      const cellEl = document.createElement("div");
      cellEl.className = `heat-cell level-${day.level}`;
      cellEl.dataset.date = day.date;
      cellEl.dataset.minutes = String(day.minutes);
      cellEl.setAttribute("role", "img");
      cellEl.setAttribute("aria-label", formatDetail(day.date, day.minutes));
      weekEl.appendChild(cellEl);
    }

    heatmapEl.appendChild(weekEl);
  }
}

function showHeatDetail(cellEl) {
  const date = cellEl.dataset.date;
  const minutes = Number(cellEl.dataset.minutes);
  heatmapDetailEl.textContent = formatDetail(date, minutes);
}

function hideHeatDetail() {
  heatmapDetailEl.textContent = "";
}

function updateHeatMap() {
  renderHeatMap();
  hideHeatDetail();
}

function updateStreaks() {
  const currentStreak = countStreak();
  const bestStreak = Math.max(countBestStreak(), currentStreak);
  streakCountEl.textContent = String(currentStreak);
  bestStreakCountEl.textContent = String(bestStreak);
}

function handleSubmit(event) {
  event.preventDefault();

  const isoDate = dateInput.value;
  const topic = topicInput.value;
  const minutes = minutesInput.value;

  if (!isoDate) {
    dateInput.focus();
    return;
  }
  if (!topic.trim()) {
    topicInput.focus();
    return;
  }
  if (minutes === "" || Number(minutes) < 1) {
    minutesInput.focus();
    return;
  }

  addSession(isoDate, topic, minutes);
  form.reset();
  setDefaultDate();
  renderSessions();
  updateStreaks();
  updateWeekTotal();
  updateMonthDays();
  updateHeatMap();
  topicInput.focus();
}

function init() {
  setDefaultDate();
  sessions = loadSessions();
  renderSessions();
  updateStreaks();
  updateWeekTotal();
  updateMonthDays();
  updateHeatMap();
}

form.addEventListener("submit", handleSubmit);

heatmapEl.addEventListener("pointerover", (event) => {
  const cell = event.target.closest(".heat-cell");
  if (cell) {
    showHeatDetail(cell);
  }
});

heatmapEl.addEventListener("click", (event) => {
  const cell = event.target.closest(".heat-cell");
  if (cell) {
    showHeatDetail(cell);
  }
});

document.addEventListener("click", (event) => {
  if (!heatmapEl.contains(event.target)) {
    hideHeatDetail();
  }
});

init();
