const STORAGE_KEY = "requirement-notebook-entries";
const OVERVIEW_PAGE = "overview";
const STATUS_OPTIONS = ["To Do", "In Progress", "Completed"];

const totalCount = document.getElementById("total-count");
const todoCount = document.getElementById("todo-count");
const inProgressCount = document.getElementById("in-progress-count");
const completedCount = document.getElementById("completed-count");
const dateTabs = document.getElementById("date-tabs");
const pages = document.getElementById("pages");

const entries = loadEntries();
const pageIds = [];

buildNotebookPages();
activatePage(OVERVIEW_PAGE);
updateSummary();

function buildNotebookPages() {
  const today = startOfDay(new Date());
  const endDate = new Date(today);
  endDate.setMonth(endDate.getMonth() + 2);

  for (let current = new Date(today); current <= endDate; current.setDate(current.getDate() + 1)) {
    const date = new Date(current);
    const pageId = formatStorageKey(date);
    pageIds.push(pageId);

    if (!entries[pageId]) {
      entries[pageId] = {
        description: "",
        actionItems: "",
        status: STATUS_OPTIONS[0],
      };
    }

    dateTabs.appendChild(createTab(pageId, formatDisplayDate(date)));
    pages.appendChild(createPage(pageId, date));
  }
}

function createTab(pageId, label) {
  const tab = document.createElement("button");
  tab.type = "button";
  tab.className = "page-tab";
  tab.dataset.page = pageId;
  tab.textContent = label;
  tab.addEventListener("click", () => activatePage(pageId));
  return tab;
}

function createPage(pageId, date) {
  const page = document.createElement("article");
  page.className = "page";
  page.dataset.page = pageId;

  const header = document.createElement("div");
  header.className = "page-header";
  header.innerHTML = `
    <h2>${formatDisplayDate(date)}</h2>
    <p>Capture requirement changes, action items, and their current status.</p>
  `;

  const sectionGrid = document.createElement("div");
  sectionGrid.className = "section-grid";

  sectionGrid.appendChild(
    createTextSection(pageId, "description", "Requirement changes", "Describe the requirement changes.")
  );
  sectionGrid.appendChild(
    createTextSection(pageId, "actionItems", "Action items", "List action items, one per line if helpful.")
  );
  sectionGrid.appendChild(createStatusSection(pageId));

  page.appendChild(header);
  page.appendChild(sectionGrid);

  return page;
}

function createTextSection(pageId, field, label, helpText) {
  const wrapper = document.createElement("section");
  wrapper.className = "entry-section";

  const fieldId = `${pageId}-${field}`;
  const labelElement = document.createElement("label");
  labelElement.htmlFor = fieldId;
  labelElement.textContent = label;

  const textarea = document.createElement("textarea");
  textarea.id = fieldId;
  textarea.value = entries[pageId][field];

  const help = document.createElement("p");
  help.className = "section-help";
  help.textContent = helpText;

  wrapper.append(labelElement, textarea, help);

  textarea.addEventListener("input", (event) => {
    updateEntry(pageId, field, event.target.value);
  });

  return wrapper;
}

function createStatusSection(pageId) {
  const wrapper = document.createElement("section");
  wrapper.className = "entry-section";

  const fieldId = `${pageId}-status`;
  wrapper.innerHTML = `
    <label for="${fieldId}">Status</label>
    <select id="${fieldId}">
      ${STATUS_OPTIONS.map((status) => `<option value="${status}">${status}</option>`).join("")}
    </select>
    <p class="section-help">Track whether this requirement change is pending, underway, or done.</p>
  `;

  const select = wrapper.querySelector("select");
  select.value = entries[pageId].status || STATUS_OPTIONS[0];
  select.addEventListener("change", (event) => {
    updateEntry(pageId, "status", event.target.value);
  });

  return wrapper;
}

function activatePage(pageId) {
  document.querySelectorAll(".page-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.page === pageId);
  });

  document.querySelectorAll(".page").forEach((page) => {
    page.classList.toggle("active", page.dataset.page === pageId);
  });
}

function updateEntry(pageId, field, value) {
  entries[pageId][field] = value;
  saveEntries(entries);
  updateSummary();
}

function updateSummary() {
  const summary = {
    total: 0,
    "To Do": 0,
    "In Progress": 0,
    Completed: 0,
  };

  pageIds.forEach((pageId) => {
    const entry = entries[pageId];
    if (!entry || !hasEntryContent(entry)) {
      return;
    }

    summary.total += 1;
    if (summary[entry.status] !== undefined) {
      summary[entry.status] += 1;
    }
  });

  totalCount.textContent = String(summary.total);
  todoCount.textContent = String(summary["To Do"]);
  inProgressCount.textContent = String(summary["In Progress"]);
  completedCount.textContent = String(summary.Completed);
}

function hasEntryContent(entry) {
  return Boolean(entry.description.trim() || entry.actionItems.trim());
}

function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch (error) {
    return {};
  }
}

function saveEntries(value) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

function formatDisplayDate(date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatStorageKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfDay(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}
