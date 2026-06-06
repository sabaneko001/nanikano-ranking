"use strict";

const DATA_URL = "./data/ranking.json?v=0004";
const STAGES_PER_PAGE = 5;
const MAX_RANK_DISPLAY = 10;
const TOTAL_STAGE_COUNT = 10;

const stageNames = Object.fromEntries(
  Array.from({ length: TOTAL_STAGE_COUNT }, (_, i) => {
    const no = i + 1;
    const id = `stage_${String(no).padStart(3, "0")}`;
    return [id, `STAGE ${String(no).padStart(3, "0")}`];
  })
);

let rankingData = null;
let currentStageId = getStageFromUrl();
let currentStagePage = getPageIndexForStage(currentStageId);

function getStageFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const stage = params.get("stage") || location.hash.replace(/^#/, "");
  return stageNames[stage] ? stage : "stage_001";
}

function getPageIndexForStage(stageId) {
  const match = String(stageId || "").match(/stage_(\d+)/);
  const stageNo = match ? Number(match[1]) : 1;
  const safeNo = Math.max(1, Math.min(TOTAL_STAGE_COUNT, stageNo));
  return Math.floor((safeNo - 1) / STAGES_PER_PAGE);
}

function getMaxStagePage() {
  return Math.max(0, Math.ceil(TOTAL_STAGE_COUNT / STAGES_PER_PAGE) - 1);
}

function setStageInUrl(stageId) {
  const url = new URL(window.location.href);
  url.searchParams.set("stage", stageId);
  url.hash = "";
  history.replaceState(null, "", url.toString());
}

function formatNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  return n.toLocaleString("ja-JP");
}

function formatHpRemain(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  return `${n.toFixed(1).replace(/\.0$/, "")}%`;
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getRecordsForStage(stageId) {
  const stages = rankingData?.stages || {};
  const records = Array.isArray(stages[stageId]) ? stages[stageId] : [];

  return [...records].sort((a, b) => {
    const turnA = Number(a.clearTurn ?? 999999);
    const turnB = Number(b.clearTurn ?? 999999);
    if (turnA !== turnB) return turnA - turnB;

    const dmgA = Number(a.maxDamage ?? 0);
    const dmgB = Number(b.maxDamage ?? 0);
    if (dmgA !== dmgB) return dmgB - dmgA;

    const hpA = Number(a.hpRemainPercent ?? 0);
    const hpB = Number(b.hpRemainPercent ?? 0);
    return hpB - hpA;
  });
}

function renderStageButtons() {
  const stageBar = document.getElementById("stageBar");
  const pageLabel = document.getElementById("stagePageLabel");
  const prevBtn = document.getElementById("prevStagePage");
  const nextBtn = document.getElementById("nextStagePage");

  const startNo = currentStagePage * STAGES_PER_PAGE + 1;
  const endNo = Math.min(TOTAL_STAGE_COUNT, startNo + STAGES_PER_PAGE - 1);
  pageLabel.textContent = `STAGE ${String(startNo).padStart(3, "0")} - ${String(endNo).padStart(3, "0")}`;

  prevBtn.disabled = currentStagePage <= 0;
  nextBtn.disabled = currentStagePage >= getMaxStagePage();

  stageBar.innerHTML = "";

  for (let no = startNo; no <= endNo; no++) {
    const stageId = `stage_${String(no).padStart(3, "0")}`;
    const btn = document.createElement("button");
    btn.className = "stageBtn";
    btn.type = "button";
    btn.dataset.stage = stageId;
    btn.textContent = stageNames[stageId] || `STAGE ${String(no).padStart(3, "0")}`;
    btn.classList.toggle("active", stageId === currentStageId);
    btn.addEventListener("click", () => {
      currentStageId = stageId;
      currentStagePage = getPageIndexForStage(currentStageId);
      setStageInUrl(currentStageId);
      render();
    });
    stageBar.appendChild(btn);
  }
}

function setupPagerButtons() {
  const prevBtn = document.getElementById("prevStagePage");
  const nextBtn = document.getElementById("nextStagePage");

  prevBtn.addEventListener("click", () => {
    if (currentStagePage <= 0) return;
    currentStagePage--;
    const firstStageNo = currentStagePage * STAGES_PER_PAGE + 1;
    currentStageId = `stage_${String(firstStageNo).padStart(3, "0")}`;
    setStageInUrl(currentStageId);
    render();
  });

  nextBtn.addEventListener("click", () => {
    if (currentStagePage >= getMaxStagePage()) return;
    currentStagePage++;
    const firstStageNo = currentStagePage * STAGES_PER_PAGE + 1;
    currentStageId = `stage_${String(firstStageNo).padStart(3, "0")}`;
    setStageInUrl(currentStageId);
    render();
  });
}

function render() {
  const title = document.getElementById("stageTitle");
  const body = document.getElementById("rankingBody");
  const status = document.getElementById("statusMessage");
  const updatedAt = document.getElementById("updatedAt");

  title.textContent = stageNames[currentStageId] || currentStageId;
  renderStageButtons();

  const updated = rankingData?.updatedAt || "";
  updatedAt.textContent = updated ? `Updated: ${formatDate(updated)}` : "";

  const records = getRecordsForStage(currentStageId).slice(0, MAX_RANK_DISPLAY);
  body.innerHTML = "";

  if (records.length <= 0) {
    status.textContent = "このステージのランキングデータはまだありません。";
    status.classList.add("visible");
    return;
  }

  status.classList.remove("visible");

  records.forEach((record, index) => {
    const rank = index + 1;
    const tr = document.createElement("tr");

    const rankClass = rank === 1 ? "top1" : rank === 2 ? "top2" : rank === 3 ? "top3" : "";
    tr.innerHTML = `
      <td><span class="rank ${rankClass}">${rank}</span></td>
      <td>${formatNumber(record.clearTurn)}</td>
      <td>${formatNumber(record.maxDamage)}</td>
      <td>${formatHpRemain(record.hpRemainPercent)}</td>
      <td>${formatDate(record.createdAt)}</td>
    `;
    body.appendChild(tr);
  });
}

async function loadRanking() {
  const status = document.getElementById("statusMessage");
  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    rankingData = await response.json();

    rankingData.stages = rankingData.stages || {};
    for (const stageId of Object.keys(stageNames)) {
      if (!Array.isArray(rankingData.stages[stageId])) rankingData.stages[stageId] = [];
    }

    render();
  } catch (error) {
    console.warn("Ranking load failed:", error);
    status.textContent = "ランキングデータを読み込めませんでした。data/ranking.json を確認してください。";
    status.classList.add("visible");
  }
}

window.addEventListener("popstate", () => {
  currentStageId = getStageFromUrl();
  currentStagePage = getPageIndexForStage(currentStageId);
  render();
});

setupPagerButtons();
loadRanking();
