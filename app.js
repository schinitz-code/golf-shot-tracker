const STORAGE_KEY = "golf-shot-tracker-entries";

const clubs = [
  { name: "Driver", image: "Driver.png" },
  { name: "3 Wood", image: "3 wood.png" },
  { name: "4 Wood", image: "4 wood.png" },
  { name: "7 Wood", image: "7 wood.png" },
  { name: "5 Iron" },
  { name: "6 Iron" },
  { name: "7 Iron", image: "7 iron.png" },
  { name: "8 Iron", image: "8 iron.png" },
  { name: "9 Iron", image: "9 iron.png" },
  { name: "Pitching Wedge", image: "PW.png" },
  { name: "48 Degrees", image: "Gap wedge 48 degrees.png" },
  { name: "52 Degree Wedge" },
  { name: "56 Degree Wedge" },
  { name: "60 Degree Wedge" }
];

const strikeRatings = [
  { value: 1, label: "1 Poor" },
  { value: 2, label: "2 Thin" },
  { value: 3, label: "3 Solid" },
  { value: 4, label: "4 Flush" },
  { value: 5, label: "5 Pure" }
];

const form = document.querySelector("#shotForm");
const teeClubPicker = document.querySelector("#teeClubPicker");
const teeClubSelect = document.querySelector("#teeClubSelect");
const approachClubSelect = document.querySelector("#approachClubSelect");
const strikeRatingGroup = document.querySelector("#strikeRatingGroup");
const historyList = document.querySelector("#historyList");
const emptyState = document.querySelector("#emptyState");
const statsGrid = document.querySelector("#statsGrid");
const heroSummary = document.querySelector("#heroSummary");
const resetFormButton = document.querySelector("#resetFormButton");
const clearAllButton = document.querySelector("#clearAllButton");
const historyTemplate = document.querySelector("#historyItemTemplate");
const saveFeedback = document.querySelector("#saveFeedback");
const navButtons = document.querySelectorAll(".mobile-nav-button");
const panels = document.querySelectorAll(".dashboard, .dashboard-panel");

let selectedStrikeRating = 3;
let entries = loadEntries();
let currentView = "entryPanel";

bootstrap();

function bootstrap() {
  populateClubSelects();
  renderClubPicker();
  renderStrikeOptions();
  form.addEventListener("submit", handleSubmit);
  resetFormButton.addEventListener("click", resetForm);
  clearAllButton.addEventListener("click", clearAllEntries);
  historyList.addEventListener("click", handleDeleteClick);
  teeClubSelect.addEventListener("change", syncPickerToSelect);
  navButtons.forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.viewTarget));
  });
  window.addEventListener("resize", handleResize);
  teeClubSelect.value = clubs[0].name;
  syncPickerToSelect();
  updateSaveFeedback();
  registerServiceWorker();
  render();
  switchView("entryPanel");
}

function populateClubSelects() {
  const optionsMarkup = [
    '<option value="">Choose club</option>',
    ...clubs.map((club) => `<option value="${club.name}">${club.name}</option>`)
  ].join("");

  teeClubSelect.innerHTML = optionsMarkup;
  approachClubSelect.innerHTML = optionsMarkup;
}

function renderClubPicker() {
  teeClubPicker.innerHTML = "";

  clubs.forEach((club) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "club-tile";
    button.dataset.club = club.name;

    if (club.image) {
      button.innerHTML = `
        <img src="${club.image}" alt="${club.name}" />
        <span>${club.name}</span>
      `;
    } else {
      button.classList.add("club-tile-text");
      button.innerHTML = `
        <span>${club.name}</span>
      `;
    }

    button.addEventListener("click", () => {
      teeClubSelect.value = club.name;
      syncPickerToSelect();
    });

    teeClubPicker.appendChild(button);
  });
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
      renderStrikeOptions();
    });

    if (rating.value === selectedStrikeRating) {
      button.classList.add("is-active");
    }

    strikeRatingGroup.appendChild(button);
  });
}

function syncPickerToSelect() {
  const selectedClub = teeClubSelect.value;
  const clubTiles = teeClubPicker.querySelectorAll(".club-tile");

  clubTiles.forEach((tile) => {
    tile.classList.toggle("is-selected", tile.dataset.club === selectedClub);
  });
}

function handleSubmit(event) {
  event.preventDefault();

  const data = new FormData(form);
  const entry = {
    id: createEntryId(),
    createdAt: new Date().toISOString(),
    roundName: normalizeText(data.get("roundName")) || "Practice Round",
    hole: Number(data.get("hole")),
    teeClub: normalizeText(data.get("teeClub")),
    teeOutcome: normalizeText(data.get("teeOutcome")),
    approachDistance: Number(data.get("approachDistance")),
    approachClub: normalizeText(data.get("approachClub")),
    approachOutcome: normalizeText(data.get("approachOutcome")),
    strikeRating: selectedStrikeRating,
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
  form.reset();
  selectedStrikeRating = 3;
  teeClubSelect.value = clubs[0].name;
  renderStrikeOptions();
  syncPickerToSelect();
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

function handleDeleteClick(event) {
  const target = event.target;

  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  if (!target.classList.contains("delete-button")) {
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
}

function renderHeroSummary() {
  const latestEntry = getLatestEntry();
  const summaryItems = [
    { value: String(entries.length), label: "Holes" },
    { value: latestEntry ? `#${latestEntry.hole}` : "-", label: "Last hole" },
    {
      value: latestEntry ? `${latestEntry.approachDistance} yds` : "-",
      label: "Last approach"
    },
    {
      value: latestEntry ? `${latestEntry.strikeRating}/5` : "-",
      label: "Last strike"
    }
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
  const teeFairways = entries.filter((entry) => entry.teeOutcome === "Fairway").length;
  const greensHit = entries.filter(
    (entry) => entry.approachOutcome === "Green in regulation"
  ).length;
  const averageApproachDistance = entries.length
    ? Math.round(
        entries.reduce((sum, entry) => sum + entry.approachDistance, 0) / entries.length
      )
    : 0;
  const averageStrike = entries.length
    ? (
        entries.reduce((sum, entry) => sum + entry.strikeRating, 0) / entries.length
      ).toFixed(1)
    : "0.0";

  const stats = [
    { label: "Holes tracked", value: String(entries.length) },
    {
      label: "Fairways found",
      value: entries.length ? `${Math.round((teeFairways / entries.length) * 100)}%` : "0%"
    },
    {
      label: "GIR approaches",
      value: entries.length ? `${Math.round((greensHit / entries.length) * 100)}%` : "0%"
    },
    { label: "Avg approach", value: `${averageApproachDistance} yds` },
    { label: "Avg strike", value: `${averageStrike} / 5` },
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
  if (!saveFeedback) {
    return;
  }

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
      { label: "Tee club", value: entry.teeClub },
      { label: "Tee result", value: entry.teeOutcome },
      { label: "Approach", value: `${entry.approachDistance} yds` },
      { label: "Approach club", value: entry.approachClub },
      { label: "Approach result", value: entry.approachOutcome },
      { label: "Strike", value: `${entry.strikeRating} / 5` }
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

function persistEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("Unable to load saved entries", error);
    return [];
  }
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
