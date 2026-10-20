const STORAGE_KEY = "diario-estudio-sessions";
const GOAL_STORAGE_KEY = "diario-estudio-goal";

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
const goalForm = document.getElementById("goalForm");
const goalInput = document.getElementById("goalInput");
const goalProgressEl = document.getElementById("goalProgress");
const goalBarEl = document.getElementById("goalBar");
const goalFillEl = document.getElementById("goalFill");
const goalDoneEl = document.getElementById("goalDone");

let sessions = [];
let goal = null;

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

function updateWeekTotal() {
  const total = countWeekMinutes(sessions, getTodayISO());
  weekMinutesEl.textContent = formatMinutes(total);
}

function loadGoal() {
  try {
    return parseGoal(localStorage.getItem(GOAL_STORAGE_KEY));
  } catch (error) {
    console.warn("No se ha podido cargar el objetivo guardado", error);
    return null;
  }
}

function saveGoal(value) {
  try {
    localStorage.setItem(GOAL_STORAGE_KEY, String(value));
  } catch (error) {
    console.warn("No se ha podido guardar el objetivo", error);
  }
}

function setGoalBarAccessible(progress) {
  goalBarEl.setAttribute("role", "progressbar");
  goalBarEl.setAttribute("aria-labelledby", "goalTitle");
  goalBarEl.setAttribute("aria-valuemin", "0");
  goalBarEl.setAttribute("aria-valuemax", String(progress.goal));
  goalBarEl.setAttribute("aria-valuenow", String(Math.min(progress.minutes, progress.goal)));
  goalBarEl.setAttribute("aria-valuetext", formatGoalValueText(progress));
  goalFillEl.removeAttribute("aria-hidden");
}

function resetGoalBar() {
  goalBarEl.removeAttribute("role");
  goalBarEl.removeAttribute("aria-labelledby");
  goalBarEl.removeAttribute("aria-valuemin");
  goalBarEl.removeAttribute("aria-valuemax");
  goalBarEl.removeAttribute("aria-valuenow");
  goalBarEl.removeAttribute("aria-valuetext");
  goalFillEl.setAttribute("aria-hidden", "true");
  goalFillEl.style.width = "0%";
}

function renderGoal() {
  const progress = buildWeeklyProgress(sessions, goal, getTodayISO());
  goalProgressEl.textContent = formatGoalText(progress.minutes, progress.goal);

  if (progress.goal === null) {
    goalInput.value = "";
    resetGoalBar();
  } else {
    goalInput.value = String(progress.goal);
    setGoalBarAccessible(progress);
    goalFillEl.style.width = `${progress.cappedRatio * 100}%`;
  }

  goalDoneEl.classList.toggle("hidden", !progress.done);
}

function handleGoalSubmit(event) {
  event.preventDefault();

  const value = Number(goalInput.value);
  if (goalInput.value === "" || !Number.isSafeInteger(value) || value < 1) {
    goalInput.focus();
    return;
  }

  goal = value;
  saveGoal(goal);
  renderGoal();
  updateWeekTotal();
  goalInput.focus();
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
  renderGoal();
  topicInput.focus();
}

function init() {
  setDefaultDate();
  sessions = loadSessions();
  goal = loadGoal();
  renderSessions();
  updateStreaks();
  updateWeekTotal();
  updateMonthDays();
  updateHeatMap();
  renderGoal();
}

form.addEventListener("submit", handleSubmit);
goalForm.addEventListener("submit", handleGoalSubmit);

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
