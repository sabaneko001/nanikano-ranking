"use strict";

const DATA_URL = "./data/ranking.json";

const stageNames = {
  stage_001: "STAGE 001",
  stage_002: "STAGE 002",
  stage_003: "STAGE 003",
  stage_004: "STAGE 004",
  stage_005: "STAGE 005",
  stage_006: "STAGE 006",
};

let rankingData = null;
let currentStageId = getStageFromUrl();

function getStageFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const stage = params.get("stage") || location.hash.replace(/^#/, "");
  return stageNames[stage] ? stage : "stage_001";
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

function formatTime(ms) {
  const n = Number(ms);
  if (!Number.isFinite(n) || n <= 0) return "-";
  const totalSec = Math.floor(n / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
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
    if (hpA !== hpB) return hpB - hpA;

    const timeA = Number(a.clearTimeMs ?? 999999999);
    const timeB = Number(b.clearTimeMs ?? 999999999);
    return timeA - timeB;
  });
}

function renderStageButtons() {
  document.querySelectorAll(".stageBtn").forEach((btn) => {
    const stageId = btn.dataset.stage;
    btn.classList.toggle("active", stageId === currentStageId);
    btn.addEventListener("click", () => {
      currentStageId = stageId;
      setStageInUrl(currentStageId);
      render();
    });
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

  const records = getRecordsForStage(currentStageId).slice(0, 100);
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
      <td>${formatTime(record.clearTimeMs)}</td>
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
    render();
  } catch (error) {
    console.warn("Ranking load failed:", error);
    status.textContent = "ランキングデータを読み込めませんでした。data/ranking.json を確認してください。";
    status.classList.add("visible");
  }
}

window.addEventListener("popstate", () => {
  currentStageId = getStageFromUrl();
  render();
});

loadRanking();
