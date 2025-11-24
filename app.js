// Offline Real Estate Personal App
// Follow-ups + Land Records with localStorage, JSON + Excel export

const STORAGE_KEYS = {
  followup: "re_full_followup_records_v1",
  land: "re_full_land_records_v1",
};

// Fields – mapped from your Excel structure (simplified)
const FOLLOWUP_FIELDS = [
  { key: "clientName", label: "Client Name", type: "text" },
  { key: "contactNumber", label: "Contact Number", type: "tel" },
  { key: "leadSource", label: "Lead Source", type: "text" },
  { key: "type", label: "Type (Buy/Sell/Rent)", type: "text" },
  { key: "propertyDetails", label: "Property Requirement / Listing Details", type: "textarea" },
  { key: "date", label: "Date", type: "date" },
  { key: "time", label: "Time", type: "time" },
  { key: "mode", label: "Mode (Call/Visit/WhatsApp)", type: "text" },
  { key: "followUpSummary", label: "Follow-Up Summary", type: "textarea" },
  { key: "clientResponse", label: "Client Response", type: "textarea" },
  { key: "nextAction", label: "Next Action", type: "textarea" },
  { key: "nextFollowUpDate", label: "Next Follow-Up Date", type: "date" },
  { key: "currentStatus", label: "Current Status", type: "text" },
  { key: "reasonIfLost", label: "Reason if Lost", type: "textarea" },
  { key: "potentialCommission", label: "Potential Commission", type: "number" },
  { key: "expectedClosureDate", label: "Expected Closure Date", type: "date" },
];

const LAND_FIELDS = [
  { key: "landId", label: "Land ID", type: "text" },
  { key: "location", label: "Location / Survey No", type: "text" },
  { key: "landArea", label: "Land Area", type: "text" },
  { key: "source", label: "Source (Broker / Seller / Buyer Requested)", type: "text" },
  { key: "brokerName", label: "Broker Name", type: "text" },
  { key: "sellerName", label: "Seller Name", type: "text" },
  { key: "buyerName", label: "Buyer Name", type: "text" },
  { key: "quotedPrice", label: "Quoted Price", type: "number" },
  { key: "expectedCommission", label: "Expected Commission", type: "number" },
  { key: "status", label: "Status", type: "text" },
  { key: "remarks", label: "Remarks", type: "textarea" },
  { key: "visitors", label: "Visitors", type: "text" },
  { key: "visitDate", label: "Visit Date", type: "date" },
  { key: "visitOutcome", label: "Visit Outcome", type: "textarea" },
];

let followupData = [];
let landData = [];
let editingContext = null; // { type: "followup" | "land", index: number | null }

function loadData() {
  followupData = JSON.parse(localStorage.getItem(STORAGE_KEYS.followup) || "[]");
  landData = JSON.parse(localStorage.getItem(STORAGE_KEYS.land) || "[]");
}

function saveData() {
  localStorage.setItem(STORAGE_KEYS.followup, JSON.stringify(followupData));
  localStorage.setItem(STORAGE_KEYS.land, JSON.stringify(landData));
}

function createTableHeader(tableElement, fields) {
  const thead = tableElement.querySelector("thead");
  thead.innerHTML = "";
  const tr = document.createElement("tr");

  const primaryKeys = fields.slice(0, 4).map(f => f.key); // first 4 columns visible

  fields.forEach(field => {
    if (!primaryKeys.includes(field.key)) return;
    const th = document.createElement("th");
    th.textContent = field.label;
    tr.appendChild(th);
  });

  const statusTh = document.createElement("th");
  statusTh.textContent = "Status";
  tr.appendChild(statusTh);

  const actionsTh = document.createElement("th");
  actionsTh.textContent = "Actions";
  tr.appendChild(actionsTh);

  thead.appendChild(tr);
}

function renderTable(type) {
  const isFollowup = type === "followup";
  const data = isFollowup ? followupData : landData;
  const fields = isFollowup ? FOLLOWUP_FIELDS : LAND_FIELDS;
  const table = document.getElementById(isFollowup ? "followup-table" : "land-table");
  const tbody = table.querySelector("tbody");
  tbody.innerHTML = "";

  const searchValue = (document.getElementById(isFollowup ? "followup-search" : "land-search").value || "").toLowerCase();
  const statusFilter = document.getElementById(isFollowup ? "followup-status-filter" : "land-status-filter").value;

  const primaryKeys = fields.slice(0, 4).map(f => f.key);

  data.forEach((row, index) => {
    const textAll = Object.values(row || {}).join(" ").toLowerCase();
    if (searchValue && !textAll.includes(searchValue)) return;

    if (statusFilter) {
      const statusValue = (row.currentStatus || row.status || "").toString().toLowerCase();
      if (statusValue !== statusFilter.toLowerCase()) return;
    }

    const tr = document.createElement("tr");

    primaryKeys.forEach(key => {
      const td = document.createElement("td");
      td.textContent = row[key] || "";
      tr.appendChild(td);
    });

    const statusTd = document.createElement("td");
    const statusText = row.currentStatus || row.status || "";
    const badge = document.createElement("span");
    badge.classList.add("badge");

    const st = statusText.toLowerCase();
    if (st.includes("open") || st.includes("follow")) {
      badge.classList.add("badge-status-open");
    } else if (st.includes("close") || st.includes("done")) {
      badge.classList.add("badge-status-closed");
    } else if (st.includes("lost") || st.includes("drop")) {
      badge.classList.add("badge-status-lost");
    }

    badge.textContent = statusText || "-";
    statusTd.appendChild(badge);
    tr.appendChild(statusTd);

    const actionsTd = document.createElement("td");
    const actionsDiv = document.createElement("div");
    actionsDiv.classList.add("actions");

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.classList.add("edit-btn");
    editBtn.addEventListener("click", () => openModal(type, row, index));

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Del";
    deleteBtn.classList.add("delete-btn");
    deleteBtn.addEventListener("click", () => {
      if (confirm("Delete this record?")) {
        if (isFollowup) {
          followupData.splice(index, 1);
        } else {
          landData.splice(index, 1);
        }
        saveData();
        renderTable("followup");
        renderTable("land");
        updateStatusFilterOptions();
      }
    });

    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);
    actionsTd.appendChild(actionsDiv);
    tr.appendChild(actionsTd);

    tbody.appendChild(tr);
  });
}

function updateStatusFilterOptions() {
  const followupStatusSet = new Set();
  followupData.forEach(r => {
    if (r.currentStatus) followupStatusSet.add(r.currentStatus);
  });

  const landStatusSet = new Set();
  landData.forEach(r => {
    if (r.status) landStatusSet.add(r.status);
  });

  const followupSelect = document.getElementById("followup-status-filter");
  const landSelect = document.getElementById("land-status-filter");

  function fillOptions(select, set) {
    const currentValue = select.value;
    select.innerHTML = "";
    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = "All Status";
    select.appendChild(allOption);
    Array.from(set).forEach(value => {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = value;
      select.appendChild(opt);
    });
    if (currentValue) select.value = currentValue;
  }

  fillOptions(followupSelect, followupStatusSet);
  fillOptions(landSelect, landStatusSet);
}

function openModal(type, record = null, index = null) {
  const isFollowup = type === "followup";
  const fields = isFollowup ? FOLLOWUP_FIELDS : LAND_FIELDS;
  editingContext = { type, index };

  const backdrop = document.getElementById("modal-backdrop");
  const title = document.getElementById("modal-title");
  const form = document.getElementById("modal-form");

  title.textContent = (record ? "Edit " : "Add ") + (isFollowup ? "Follow-Up" : "Land Record");
  form.innerHTML = "";

  fields.forEach(field => {
    const rowDiv = document.createElement("div");
    rowDiv.classList.add("form-row");

    const label = document.createElement("label");
    label.textContent = field.label;
    rowDiv.appendChild(label);

    let input;
    if (field.type === "textarea") {
      input = document.createElement("textarea");
    } else {
      input = document.createElement("input");
      input.type = field.type;
    }
    input.name = field.key;
    input.value = record && record[field.key] ? record[field.key] : "";
    rowDiv.appendChild(input);

    form.appendChild(rowDiv);
  });

  const saveButton = document.createElement("button");
  saveButton.id = "modal-save";
  saveButton.type = "button";
  saveButton.textContent = "Save";
  saveButton.addEventListener("click", handleModalSave);
  form.appendChild(saveButton);

  backdrop.classList.remove("hidden");
}

function closeModal() {
  const backdrop = document.getElementById("modal-backdrop");
  backdrop.classList.add("hidden");
  editingContext = null;
}

function handleModalSave() {
  if (!editingContext) return;
  const { type, index } = editingContext;
  const isFollowup = type === "followup";
  const fields = isFollowup ? FOLLOWUP_FIELDS : LAND_FIELDS;
  const form = document.getElementById("modal-form");

  const record = {};
  fields.forEach(field => {
    const value = form.querySelector(`[name="${field.key}"]`).value;
    record[field.key] = value;
  });

  if (index == null || index === undefined) {
    if (isFollowup) followupData.unshift(record);
    else landData.unshift(record);
  } else {
    if (isFollowup) followupData[index] = record;
    else landData[index] = record;
  }

  saveData();
  renderTable("followup");
  renderTable("land");
  updateStatusFilterOptions();
  closeModal();
}

function exportJSON(type) {
  const data = type === "followup" ? followupData : landData;
  const filename = type + "_export.json";
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

function exportExcel(type) {
  const data = type === "followup" ? followupData : landData;
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, type === "followup" ? "FollowUp" : "Land");
  XLSX.writeFile(wb, type + "_export.xlsx");
}

function setupTabs() {
  const buttons = document.querySelectorAll(".tab-button");
  const contents = document.querySelectorAll(".tab-content");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      buttons.forEach(b => b.classList.toggle("active", b === btn));
      contents.forEach(c => c.classList.toggle("active", c.id === tab));
    });
  });
}

function setupEvents() {
  document.getElementById("followup-add").addEventListener("click", () => openModal("followup"));
  document.getElementById("land-add").addEventListener("click", () => openModal("land"));

  document.getElementById("modal-close").addEventListener("click", closeModal);
  document.getElementById("modal-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "modal-backdrop") closeModal();
  });

  document.getElementById("followup-search").addEventListener("input", () => renderTable("followup"));
  document.getElementById("land-search").addEventListener("input", () => renderTable("land"));

  document.getElementById("followup-status-filter").addEventListener("change", () => renderTable("followup"));
  document.getElementById("land-status-filter").addEventListener("change", () => renderTable("land"));

  document.getElementById("followup-export-json").addEventListener("click", () => exportJSON("followup"));
  document.getElementById("land-export-json").addEventListener("click", () => exportJSON("land"));

  document.getElementById("followup-export-xlsx").addEventListener("click", () => exportExcel("followup"));
  document.getElementById("land-export-xlsx").addEventListener("click", () => exportExcel("land"));
}

document.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  loadData();

  createTableHeader(document.getElementById("followup-table"), FOLLOWUP_FIELDS);
  createTableHeader(document.getElementById("land-table"), LAND_FIELDS);

  setupEvents();
  updateStatusFilterOptions();
  renderTable("followup");
  renderTable("land");
});
