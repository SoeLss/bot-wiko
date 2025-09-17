import { makeWASocket, useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import express from "express";
import fetch from "node-fetch";
import qrcode from "qrcode-terminal";
import cron from "node-cron";
import { setTimeout as delay } from "timers/promises";
import fs from "fs";

const SERVER_HOST = "172.16.100.163";
const SERVER_PORT = 3005;
let TARGET_TYPE = "group"; //OR private
let TARGET_ID = "120363163764328187@g.us";
const DATA_URL = "http://172.16.100.192/api-handler.php"; // your api
const TIMEZONE = "Asia/Jakarta";
const LAST_FILE = "./last_report.json";

function pad2(n) { return String(n).padStart(2, "0"); }
function formatFullTimestamp(date = new Date()) {
  const hari = new Intl.DateTimeFormat("id-ID", { weekday: "long", timeZone: TIMEZONE }).format(date);
  const tanggal = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric", timeZone: TIMEZONE }).format(date);
  const h = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", hour12: false, timeZone: TIMEZONE }).format(date);
  const m = new Intl.DateTimeFormat("id-ID", { minute: "2-digit", timeZone: TIMEZONE }).format(date);
  const s = new Intl.DateTimeFormat("id-ID", { second: "2-digit", timeZone: TIMEZONE }).format(date);
  const jam = `${pad2(parseInt(h, 10))}.${pad2(parseInt(m, 10))}.${pad2(parseInt(s, 10))}`;
  return `${hari}, ${tanggal} • ${jam} WIB`;
}

async function fetchJSONWithRetry(url, { attempts = 3, timeoutMs = 8000 } = {}) {
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      clearTimeout(id);
      lastErr = err;
      if (i < attempts) await delay(1000 * i);
    }
  }
  throw lastErr;
}

function buildMessage(dataArray) {
  const now = new Date();
  const ts = `${pad2(now.getDate())}-${pad2(now.getMonth() + 1)}-${now.getFullYear()} ${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
  if (!Array.isArray(dataArray) || dataArray.length === 0) return `🤖 Pesan Bot Wiko 🤖 - ${ts}\n_Tidak ada data_`;
  let lastData = {};
  if (fs.existsSync(LAST_FILE)) {
    try { lastData = JSON.parse(fs.readFileSync(LAST_FILE, "utf8")); } catch {}
  }
  const totalDevices = dataArray.length;
  const onlineDevices = dataArray.filter(d => (d.status || "").toLowerCase() === "hidup").length;
  const unreachableDevices = totalDevices - onlineDevices;
  let lokasiList = "";
  const newData = {};
  dataArray.forEach(d => {
    const prev = lastData[d.name] ?? d.customer_served;
    const diff = d.customer_served - prev;
    lokasiList += `${d.name} = ${d.customer_served} (${diff >= 0 ? "+" + diff : diff})\n`;
    newData[d.name] = d.customer_served;
  });
  fs.writeFileSync(LAST_FILE, JSON.stringify(newData));
  const unreachableList = dataArray.filter(d => (d.status || "").toLowerCase().startsWith("mati")).map(d => `${d.name} is unreachable.`).join("\n");
  return `Quick Report Wiko - ${ts}
Online: ${onlineDevices}/${totalDevices}
Unreachable: ${unreachableDevices}/${totalDevices}

${lokasiList}

Unreachable Devices:
${unreachableList}`;
}

let sock = null;
let groupList = [];
let isSending = false;

async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");
  sock = makeWASocket({ auth: state, printQRInTerminal: true, markOnlineOnConnect: true, syncFullHistory: false, browser: ["RPi-Forwarder", "Chrome", "1.0"] });
  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) qrcode.generate(qr, { small: true });
    if (connection === "open") await loadGroupList();
    if (connection === "close") {
      const shouldReconnect = !lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) { await delay(2000); startWhatsApp(); }
      else process.exit(0);
    }
  });
  sock.ev.on("chats.set", loadGroupList);
  sock.ev.on("groups.update", loadGroupList);
}

async function loadGroupList() {
  try {
    const groups = await sock.groupFetchAllParticipating();
    groupList = Object.values(groups).sort((a, b) => a.subject.localeCompare(b.subject, "id")).map(g => ({ id: g.id, name: g.subject }));
  } catch {}
}

async function sendReportTo(targetType, targetId) {
  if (!sock) throw new Error("Socket WA belum siap.");
  if (targetType === "group" && !targetId.endsWith("@g.us")) throw new Error("groupId tidak valid.");
  if (targetType === "private" && !targetId.endsWith("@s.whatsapp.net")) throw new Error("nomor WA tidak valid.");
  if (isSending) return;
  isSending = true;
  try {
    const data = await fetchJSONWithRetry(DATA_URL);
    const msg = buildMessage(data);
    await sock.sendMessage(targetId, { text: msg });
  } finally {
    isSending = false;
  }
}

cron.schedule("55 59 8 * * *", () => sendReportTo(TARGET_TYPE, TARGET_ID), { timezone: TIMEZONE });
cron.schedule("55 29 15 * * *", () => sendReportTo(TARGET_TYPE, TARGET_ID), { timezone: TIMEZONE });

const app = express();
app.use(express.json());
app.get("/", (_req, res) => {
  const rows = groupList.map(g => `<tr><td>${escapeHtml(g.name)}</td><td><code>${g.id}</code></td><td><button onclick="copyId('${g.id}')">Copy ID</button></td><td><button onclick="sendNow('${g.id}','group')">Kirim Uji</button></td></tr>`).join("");
  const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Daftar Grup WhatsApp</title></head><body><h2>Daftar Grup WhatsApp</h2><table border="1"><thead><tr><th>Nama Grup</th><th>ID Grup</th><th>Copy</th><th>Test Kirim</th></tr></thead><tbody>${rows || '<tr><td colspan="4">Belum ada data grup.</td></tr>'}</tbody></table><script>async function copyId(id){try{await navigator.clipboard.writeText(id);alert('ID disalin: '+id);}catch(e){prompt('Salin manual:',id);}}async function sendNow(id,type){const r=await fetch('/send?targetId='+encodeURIComponent(id)+'&type='+encodeURIComponent(type));alert(JSON.stringify(await r.json(),null,2));}</script></body></html>`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});
app.get("/send", async (req, res) => {
  const targetId = req.query.targetId || TARGET_ID;
  const type = req.query.type || TARGET_TYPE;
  try {
    await sendReportTo(type, targetId);
    res.json({ ok: true, targetId, type, at: formatFullTimestamp() });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});
app.post("/send", async (req, res) => {
  const { targetId, type } = req.body || {};
  if (!targetId || !type) return res.status(400).json({ ok: false, error: "targetId dan type diperlukan" });
  try {
    await sendReportTo(type, targetId);
    res.json({ ok: true, targetId, type, at: formatFullTimestamp() });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});
app.listen(SERVER_PORT, SERVER_HOST, () => {});
startWhatsApp().catch(() => process.exit(1));

function escapeHtml(s = "") {
  return String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
process.on("SIGINT", async () => { try { await sock?.ws?.close(); } catch {} process.exit(0); });
process.on("SIGTERM", async () => { try { await sock?.ws?.close(); } catch {} process.exit(0); });
