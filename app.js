const STORAGE_KEY = "golf-shot-tracker-entries";
const ROUND_NAME_STORAGE_KEY = "golf-shot-tracker-round-name";

const teeClubs = [
  { name: "Driver" },
  { name: "Mini Driver" },
  { name: "4 Wood" },
  { name: "7 Wood" },
  { name: "5 Iron" },
  { name: "6 Iron" },
  { name: "7 Iron" },
  { name: "8 Iron" },
  { name: "9 Iron" },
  { name: "Pitching Wedge" },
  { name: "48 Degree Wedge" },
  { name: "52 Degree Wedge" },
  { name: "56 Degree Wedge" },
  { name: "60 Degree Wedge" }
];

const approachClubs = [
  { name: "60 Degree Wedge" },
  { name: "56 Degree Wedge" },
  { name: "52 Degree Wedge" },
  { name: "48 Degree Wedge" },
  { name: "Pitching Wedge" },
  { name: "9 Iron" },
  { name: "8 Iron" },
  { name: "7 Iron" },
  { name: "6 Iron" },
  { name: "5 Iron" },
  { name: "7 Wood" },
  { name: "4 Wood" }
];

const parOptions = ["3", "4", "5"];
const teeOutcomes = [
  "Fairway",
  "Fairway bunker",
  "Left rough",
  "Right rough",
  "Left trees",
  "Right trees",
  "Penalty area",
  "Out of bounds"
];
const approachOutcomes = [
  "GIR",
  "Pin high",
  "Left",
  "Right",
  "Fringe",
  "Rough",
  "Long",
  "Short",
  "Greenside bunker",
  "Penalty area"
];
const strikeRatings = [
  { value: 1, label: "Flush" },
  { value: 2, label: "OK" },
  { value: 3, label: "Miss" }
];
const shotResultOptions = ["Good", "Bad"];
const puttOptions = ["1", "2", "3"];
const makeUnderSixOptions = ["Yes", "No", "N/A"];

const form = document.querySelector("#shotForm");
const roundNameInput = document.querySelector('input[name="roundName"]');
const parInput = document.querySelector("#parInput");
const parGroup = document.querySelector("#parGroup");
const teeShotSection = document.querySelector("#teeShotSection");
const teeClubPicker = document.querySelector("#teeClubPicker");
const teeClubInput = document.querySelector("#teeClubInput");
const teeOutcomeInput = document.querySelector("#teeOutcomeInput");
const teeOutcomeGroup = document.querySelector("#teeOutcomeGroup");
const approachClubInput = document.querySelector("#approachClubInput");
const approachClubGroup = document.querySelector("#approachClubGroup");
const approachOutcomeInput = document.querySelector("#approachOutcomeInput");
const approachOutcomeGroup = document.querySelector("#approachOutcomeGroup");
const shotResultInput = document.querySelector("#shotResultInput");
const shotResultGroup = document.querySelector("#shotResultGroup");
const strikeRatingGroup = document.querySelector("#strikeRatingGroup");
const puttsInput = document.querySelector("#puttsInput");
const puttsGroup = document.querySelector("#puttsGroup");
const makeUnderSixInput = document.querySelector("#makeUnderSixInput");
const makeUnderSixGroup = document.querySelector("#makeUnderSixGroup");
const historyList = document.querySelector("#historyList");
const emptyState = document.querySelector("#emptyState");
const statsGrid = document.querySelector("#statsGrid");
const clubReport = document.querySelector("#clubReport");
const heroSummary = document.querySelector("#heroSummary");
const startRoundButton = document.querySelector("#startRoundButton");
const resetFormButton = document.querySelector("#resetFormButton");
const clearAllButton = document.querySelector("#clearAllButton");
const exportButton = document.querySelector("#exportButton");
const historyTemplate = document.querySelector("#historyItemTemplate");
const saveFeedback = document.querySelector("#saveFeedback");
const navButtons = document.querySelectorAll(".mobile-nav-button");
const panels = document.querySelectorAll(".dashboard, .dashboard-panel");

let selectedStrikeRating = 2;
let selectedApproachOutcomes = ["GIR"];
let entries = loadEntries();
let currentView = "entryPanel";

bootstrap();

function bootstrap() {
  renderTeeClubPicker();
  renderOptionGroup(parGroup, parInput, parOptions, "option-button", syncParView);
  renderOptionGroup(teeOutcomeGroup, teeOutcomeInput, teeOutcomes);
  renderOptionGroup(approachClubGroup, approachClubInput, approachClubs.map((club) => club.name));
  renderMultiSelectGroup(approachOutcomeGroup, approachOutcomes, selectedApproachOutcomes);
  renderOptionGroup(shotResultGroup, shotResultInput, shotResultOptions);
  renderOptionGroup(puttsGroup, puttsInput, puttOptions, "option-button");
  renderOptionGroup(makeUnderSixGroup, makeUnderSixInput, makeUnderSixOptions, "option-button");
  renderStrikeOptions();

  form.addEventListener("submit", handleSubmit);
  resetFormButton.addEventListener("click", resetForm);
  startRoundButton.addEventListener("click", startNewRound);
  clearAllButton.addEventListener("click", clearAllEntries);
  exportButton.addEventListener("click", exportEntriesAsCsv);
  historyList.addEventListener("click", handleDeleteClick);
  navButtons.forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.viewTarget));
  });
  window.addEventListener("resize", handleResize);

  roundNameInput.value = loadSavedRoundName();
  resetForm();
  updateSaveFeedback();
  registerServiceWorker();
  render();
  switchView("entryPanel");
}

function renderTeeClubPicker() {
  teeClubPicker.innerHTML = "";

  teeClubs.forEach((club) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "club-tile club-tile-text";
    button.dataset.value = club.name;
    button.innerHTML = `<span>${club.name}</span>`;
    button.addEventListener("click", () => {
      teeClubInput.value = club.name;
      syncClubPicker();
    });
    teeClubPicker.appendChild(button);
  });
}

function renderOptionGroup(container, input, options, buttonClass = "option-button", onChange) {
  container.innerHTML = "";

  options.forEach((option) => {
    const value = typeof option === "string" ? option : option.value;
    const label = typeof option === "string" ? option : option.label;
    const button = document.createElement("button");
    button.type = "button";
    button.className = buttonClass;
    button.dataset.value = value;
    button.textContent = label;
    button.addEventListener("click", () => {
      input.value = value;
      syncOptionButtons(container, input.value);
      if (onChange) {
        onChange();
      }
    });
    container.appendChild(button);
  });
}

function renderMultiSelectGroup(container, options, selectedValues) {
  container.innerHTML = "";

  options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-button";
    button.dataset.value = option;
    button.textContent = option;
    button.addEventListener("click", () => {
      toggleApproachOutcome(option);
    });
    container.appendChild(button);
  });

  syncMultiSelectButtons(container, selectedValues);
}

function renderStrikeOptions() {
  strikeRatingGroup.innerHTML = "";

  strikeRatings.forEach((rating) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "rating-pill";
    button.textContent = rating.label;
    button.dataset.value = String(rating.value);
    button.addEventListener("click", () => {
      selectedStrikeRating = rating.value;
      syncStrikeButtons();
    });
    strikeRatingGroup.appendChild(button);
  });

  syncStrikeButtons();
}

function syncOptionButtons(container, selectedValue) {
  container.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.value === selectedValue);
  });
}

function syncMultiSelectButtons(container, selectedValues) {
  const selectedSet = new Set(selectedValues);
  container.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("is-selected", selectedSet.has(button.dataset.value));
  });
}

function syncClubPicker() {
  teeClubPicker.querySelectorAll(".club-tile").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.value === teeClubInput.value);
  });
}

function syncStrikeButtons() {
  strikeRatingGroup.querySelectorAll(".rating-pill").forEach((button) => {
    button.classList.toggle("is-active", Number(button.dataset.value) === selectedStrikeRating);
  });
}

function toggleApproachOutcome(value) {
  if (selectedApproachOutcomes.includes(value)) {
    selectedApproachOutcomes = selectedApproachOutcomes.filter((item) => item !== value);
  } else {
    selectedApproachOutcomes = [...selectedApproachOutcomes, value];
  }

  approachOutcomeInput.value = selectedApproachOutcomes.join(" | ");
  syncMultiSelectButtons(approachOutcomeGroup, selectedApproachOutcomes);
}

function handleSubmit(event) {
  event.preventDefault();

  if (!form.reportValidity()) {
    return;
  }

  const par = Number(parInput.value || "4");
  const isPar3 = par === 3;
  const missingSelections = [];

  if (!approachClubInput.value) {
    missingSelections.push("approach club");
  }
  if (!selectedApproachOutcomes.length) {
    missingSelections.push("approach result");
  }
  if (!puttsInput.value) {
    missingSelections.push("number of putts");
  }
  if (!makeUnderSixInput.value) {
    missingSelections.push("make under 6 feet");
  }
  if (!shotResultInput.value) {
    missingSelections.push("result");
  }
  if (!isPar3 && !teeClubInput.value) {
    missingSelections.push("tee club");
  }
  if (!isPar3 && !teeOutcomeInput.value) {
    missingSelections.push("tee result");
  }

  if (missingSelections.length) {
    window.alert(`Please select: ${missingSelections.join(", ")}.`);
    return;
  }

  const data = new FormData(form);
  const submittedRoundName = normalizeText(data.get("roundName"));
  const rememberedRoundName = loadSavedRoundName();
  const roundName = submittedRoundName || rememberedRoundName || "Practice Round";

  saveRoundName(roundName);
  roundNameInput.value = roundName;

  const entry = {
    id: createEntryId(),
    createdAt: new Date().toISOString(),
    roundName,
    hole: Number(data.get("hole")),
    par,
    teeClub: isPar3 ? "N/A (Par 3)" : teeClubInput.value,
    teeOutcome: isPar3 ? "Not tracked" : teeOutcomeInput.value,
    approachDistance: Number(data.get("approachDistance")),
    approachClub: approachClubInput.value,
    approachOutcome: [...selectedApproachOutcomes],
    shotResult: shotResultInput.value,
    strikeRating: selectedStrikeRating,
    firstPuttDistance: Number(data.get("firstPuttDistance")),
    putts: Number(puttsInput.value),
    makeUnderSix: makeUnderSixInput.value,
    notes: normalizeText(data.get("notes"))
  };

  entries = [entry, ...entries];

  persistEntries();
  resetForm();
  updateSaveFeedback(entry);
  render();
  switchView("statsPanel");
}

function resetForm() {
  const savedRoundName = loadSavedRoundName();

  form.reset();
  roundNameInput.value = savedRoundName;
  parInput.value = "4";
  teeClubInput.value = "";
  teeOutcomeInput.value = "";
  approachClubInput.value = "";
  selectedApproachOutcomes = ["GIR"];
  approachOutcomeInput.value = selectedApproachOutcomes.join(" | ");
  shotResultInput.value = "";
  puttsInput.value = "2";
  makeUnderSixInput.value = "";
  selectedStrikeRating = 2;

  syncOptionButtons(parGroup, parInput.value);
  syncOptionButtons(teeOutcomeGroup, teeOutcomeInput.value);
  syncOptionButtons(approachClubGroup, approachClubInput.value);
  syncMultiSelectButtons(approachOutcomeGroup, selectedApproachOutcomes);
  syncOptionButtons(shotResultGroup, shotResultInput.value);
  syncOptionButtons(puttsGroup, puttsInput.value);
  syncOptionButtons(makeUnderSixGroup, makeUnderSixInput.value);
  syncClubPicker();
  syncStrikeButtons();
  syncParView();
  updateSaveFeedback();
}

function clearAllEntries() {
  const confirmed = window.confirm("Delete all saved golf shot entries?");

  if (!confirmed) {
    return;
  }

  entries = [];
  persistEntries();
  updateSaveFeedback();
  render();
  switchView("entryPanel");
}

function startNewRound() {
  localStorage.removeItem(ROUND_NAME_STORAGE_KEY);
  resetForm();
  roundNameInput.focus();
}

function handleDeleteClick(event) {
  const target = event.target;

  if (!(target instanceof HTMLButtonElement) || !target.classList.contains("delete-button")) {
    return;
  }

  const card = target.closest(".history-card");
  const entryId = card?.dataset.entryId;

  if (!entryId) {
    return;
  }

  entries = entries.filter((entry) => entry.id !== entryId);
  persistEntries();
  updateSaveFeedback();
  render();
}

function render() {
  renderHeroSummary();
  renderStats();
  renderHistory();
  renderClubReport();
  exportButton.disabled = entries.length === 0;
}

function renderHeroSummary() {
  const latestEntry = getLatestEntry();
  const summaryItems = [
    { value: String(entries.length), label: "Holes" },
    { value: latestEntry ? `#${latestEntry.hole}` : "-", label: "Last hole" },
    { value: latestEntry ? `Par ${latestEntry.par}` : "-", label: "Last par" },
    { value: latestEntry ? `${latestEntry.putts} putts` : "-", label: "Last putting" }
  ];

  heroSummary.innerHTML = summaryItems
    .map(
      (item) => `
        <div class="hero-summary-item">
          <strong>${item.value}</strong>
          <span>${item.label}</span>
        </div>
      `
    )
    .join("");
}

function renderStats() {
  const latestEntry = getLatestEntry();
  const teeOpportunities = entries.filter((entry) => entry.par !== 3);
  const teeFairways = teeOpportunities.filter((entry) => entry.teeOutcome === "Fairway").length;
  const girs = entries.filter((entry) => getApproachOutcomeList(entry).includes("GIR")).length;
  const averageApproachDistance = entries.length
    ? Math.round(entries.reduce((sum, entry) => sum + entry.approachDistance, 0) / entries.length)
    : 0;
  const averagePutts = entries.length
    ? (entries.reduce((sum, entry) => sum + entry.putts, 0) / entries.length).toFixed(1)
    : "0.0";
  const makeUnderSixAttempts = entries.filter(
    (entry) => entry.makeUnderSix === "Yes" || entry.makeUnderSix === "No"
  );
  const goodResults = entries.filter((entry) => entry.shotResult === "Good").length;
  const makeUnderSixRate = makeUnderSixAttempts.length
    ? Math.round(
        (makeUnderSixAttempts.filter((entry) => entry.makeUnderSix === "Yes").length /
          makeUnderSixAttempts.length) *
          100
      )
    : 0;

  const stats = [
    { label: "Holes tracked", value: String(entries.length) },
    {
      label: "Fairways found",
      value: teeOpportunities.length
        ? `${Math.round((teeFairways / teeOpportunities.length) * 100)}%`
        : "N/A"
    },
    { label: "GIR approaches", value: entries.length ? `${Math.round((girs / entries.length) * 100)}%` : "0%" },
    { label: "Avg approach", value: `${averageApproachDistance} yds` },
    { label: "Avg putts", value: `${averagePutts}` },
    { label: "Good result", value: entries.length ? `${Math.round((goodResults / entries.length) * 100)}%` : "0%" },
    {
      label: "Make <6'",
      value: makeUnderSixAttempts.length ? `${makeUnderSixRate}%` : "N/A"
    },
    { label: "Last saved", value: latestEntry ? formatDate(latestEntry.createdAt) : "None" }
  ];

  statsGrid.innerHTML = stats
    .map(
      (stat) => `
        <article class="stat-card">
          <p class="stat-label">${stat.label}</p>
          <p class="stat-value">${stat.value}</p>
        </article>
      `
    )
    .join("");
}

function renderClubReport() {
  if (!entries.length) {
    clubReport.innerHTML = `
      <div class="empty-state">Save a few holes to build per-club trends.</div>
    `;
    return;
  }

  const clubTotals = new Map();

  entries.forEach((entry) => {
    const current = clubTotals.get(entry.approachClub) || {
      clubName: entry.approachClub,
      shots: 0,
      totalDistance: 0,
      totalStrike: 0,
      girs: 0
    };

    current.shots += 1;
    current.totalDistance += entry.approachDistance;
    current.totalStrike += entry.strikeRating;
    if (getApproachOutcomeList(entry).includes("GIR")) {
      current.girs += 1;
    }

    clubTotals.set(entry.approachClub, current);
  });

  clubReport.innerHTML = [...clubTotals.values()]
    .sort((a, b) => b.shots - a.shots || a.clubName.localeCompare(b.clubName))
    .map((club) => {
      const avgDistance = Math.round(club.totalDistance / club.shots);
      const avgStrike = (club.totalStrike / club.shots).toFixed(1);
      const girRate = Math.round((club.girs / club.shots) * 100);

      return `
        <article class="club-report-card">
          <div class="club-report-card-top">
            <h4>${club.clubName}</h4>
            <span class="club-report-meta">${club.shots} shot${club.shots === 1 ? "" : "s"}</span>
          </div>
          <div class="club-report-stats">
            <div class="detail-chip"><strong>Avg Distance</strong>${avgDistance} yds</div>
            <div class="detail-chip"><strong>Avg Strike</strong>${avgStrike} / 5</div>
            <div class="detail-chip"><strong>GIR Rate</strong>${girRate}%</div>
          </div>
        </article>
      `;
    })
    .join("");
}

function switchView(targetId) {
  currentView = targetId;

  if (window.innerWidth >= 1180) {
    panels.forEach((panel) => {
      panel.hidden = false;
    });
    navButtons.forEach((button) => button.classList.remove("is-active"));
    return;
  }

  panels.forEach((panel) => {
    panel.hidden = panel.id !== targetId;
  });

  navButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.viewTarget === targetId);
  });
}

function handleResize() {
  switchView(currentView);
}

function updateSaveFeedback(savedEntry) {
  if (savedEntry) {
    saveFeedback.textContent = `Saved hole ${savedEntry.hole} for ${savedEntry.roundName}.`;
    return;
  }

  const latestEntry = getLatestEntry();
  saveFeedback.textContent = latestEntry
    ? `Latest saved: hole ${latestEntry.hole} on ${formatDate(latestEntry.createdAt)}.`
    : "Nothing saved yet.";
}

function renderHistory() {
  const displayEntries = getDisplayEntries();

  historyList.innerHTML = "";
  emptyState.hidden = entries.length > 0;

  displayEntries.forEach((entry) => {
    const fragment = historyTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".history-card");
    const round = fragment.querySelector(".history-round");
    const hole = fragment.querySelector(".history-hole");
    const details = fragment.querySelector(".history-details");
    const notes = fragment.querySelector(".history-notes");

    card.dataset.entryId = entry.id;
    round.textContent = `${entry.roundName} • ${formatDate(entry.createdAt)}`;
    hole.textContent = `Hole ${entry.hole}`;

    const detailItems = [
      { label: "Par", value: String(entry.par) },
      { label: "Tee club", value: entry.teeClub },
      { label: "Tee result", value: entry.teeOutcome },
      { label: "Approach", value: `${entry.approachDistance} yds` },
      { label: "Approach club", value: entry.approachClub },
      { label: "Approach result", value: formatApproachOutcome(entry.approachOutcome) },
      { label: "Result", value: entry.shotResult },
      { label: "Strike", value: getStrikeRatingLabel(entry.strikeRating) },
      { label: "1st putt", value: `${entry.firstPuttDistance} ft` },
      { label: "Putts", value: String(entry.putts) },
      { label: "Make <6'", value: entry.makeUnderSix }
    ];

    detailItems.forEach((item) => {
      const chip = document.createElement("div");
      chip.className = "detail-chip";
      chip.innerHTML = `<strong>${item.label}</strong>${item.value}`;
      details.appendChild(chip);
    });

    if (entry.notes) {
      notes.textContent = entry.notes;
    } else {
      notes.remove();
    }

    historyList.appendChild(fragment);
  });
}

async function exportEntriesAsCsv() {
  if (!entries.length) {
    return;
  }

  const sortedEntries = [...entries].sort((a, b) => a.hole - b.hole);
  const headers = [
    "Course/Round",
    "Hole",
    "Par",
    "Date",
    "Tee Club",
    "Tee Outcome",
    "Approach Distance",
    "Approach Club",
    "Approach Outcome",
    "Result",
    "Strike Rating",
    "First Putt Distance",
    "Number Of Putts",
    "Make <6'",
    "Notes"
  ];

  const rows = sortedEntries.map((entry) => [
    entry.roundName,
    entry.hole,
    entry.par,
    formatExportDate(entry.createdAt),
    entry.teeClub,
    entry.teeOutcome,
    entry.approachDistance,
    entry.approachClub,
    formatApproachOutcome(entry.approachOutcome),
    entry.shotResult,
    getStrikeRatingLabel(entry.strikeRating),
    entry.firstPuttDistance,
    entry.putts,
    entry.makeUnderSix,
    entry.notes
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const latestEntry = getLatestEntry();
  const baseName = latestEntry?.roundName || "golf-round";
  const fileName = `${slugifyFileName(baseName)}-shots.csv`;

  if (navigator.share && typeof File !== "undefined") {
    const file = new File([blob], fileName, { type: "text/csv" });

    try {
      await navigator.share({
        title: "Golf Shot Tracker Export",
        files: [file]
      });
      return;
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }
    }
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function persistEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw
      ? JSON.parse(raw).map((entry) => ({
          ...entry,
          par: entry.par ? Number(entry.par) : 4,
          strikeRating: normalizeStrikeRating(entry.strikeRating),
          putts: entry.putts ? Number(entry.putts) : 0,
          firstPuttDistance: entry.firstPuttDistance ? Number(entry.firstPuttDistance) : 0,
          approachOutcome: getApproachOutcomeList(entry),
          shotResult: entry.shotResult || "",
          makeUnderSix: entry.makeUnderSix || ""
        }))
      : [];
  } catch (error) {
    console.error("Unable to load saved entries", error);
    return [];
  }
}

function loadSavedRoundName() {
  try {
    return localStorage.getItem(ROUND_NAME_STORAGE_KEY) || "";
  } catch (error) {
    console.error("Unable to load saved round name", error);
    return "";
  }
}

function saveRoundName(value) {
  try {
    localStorage.setItem(ROUND_NAME_STORAGE_KEY, value);
  } catch (error) {
    console.error("Unable to save round name", error);
  }
}

function syncParView() {
  const isPar3 = Number(parInput.value) === 3;
  teeShotSection.classList.toggle("is-hidden", isPar3);
}

function normalizeText(value) {
  return String(value || "").trim();
}

function getDisplayEntries() {
  return [...entries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getLatestEntry() {
  return getDisplayEntries()[0] || null;
}

function createEntryId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `entry-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

function formatExportDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(value));
}

function escapeCsvValue(value) {
  const stringValue = String(value ?? "");
  return `"${stringValue.replaceAll('"', '""')}"`;
}

function slugifyFileName(value) {
  return String(value || "golf-round")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getStrikeRatingLabel(value) {
  const match = strikeRatings.find((rating) => rating.value === Number(value));
  return match ? match.label : String(value ?? "");
}

function getApproachOutcomeList(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value) {
    return [];
  }

  return String(value)
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatApproachOutcome(value) {
  return getApproachOutcomeList(value).join(", ");
}

function normalizeStrikeRating(value) {
  const numericValue = Number(value);

  if (numericValue >= 4) {
    return 3;
  }

  if (numericValue <= 1 || Number.isNaN(numericValue)) {
    return 1;
  }

  return numericValue;
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.error("Service worker registration failed", error);
    });
  });
}
