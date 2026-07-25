const { kv } = require('@vercel/kv');

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const SETTINGS_KEY = 'kios:settings';
const QUEUE_INDEX_KEY = 'kios:queue:index';

function todayWIB() {
  return new Date(Date.now() + WIB_OFFSET_MS).toISOString().slice(0, 10);
}

function dayRangeWIB(dateStr) {
  const start = new Date(`${dateStr}T00:00:00+07:00`).getTime();
  const end = start + 24 * 60 * 60 * 1000 - 1;
  return { start, end };
}

const DEFAULT_SETTINGS = {
  rate: 200,
  bankName: '',
  accountNumber: '',
  accountHolder: '',
  feePercent: 0,
  feeFlatIDR: 0,
  loyaltyThreshold: 0,
  loyaltyDiscountPercent: 0,
  totalWindows: 1,
};

async function getSettings() {
  const s = await kv.get(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...(s || {}) };
}

async function setSettings(patch) {
  const current = await getSettings();
  const updated = { ...current, ...patch };
  await kv.set(SETTINGS_KEY, updated);
  return updated;
}

async function nextQueueNumber(type) {
  const prefix = type === 'rub_to_idr' ? 'J' : 'B';
  const key = `kios:counter:${prefix}:${todayWIB()}`;
  const n = await kv.incr(key);
  await kv.expire(key, 60 * 60 * 48);
  return `${prefix}${String(n).padStart(3, '0')}`;
}

async function createTicket(data) {
  const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = Date.now();
  const ticket = { id, ...data, createdAt, status: 'menunggu' };
  await kv.set(`kios:queue:${id}`, ticket);
  await kv.zadd(QUEUE_INDEX_KEY, { score: createdAt, member: id });
  return ticket;
}

async function getTicket(id) {
  return kv.get(`kios:queue:${id}`);
}

async function updateTicket(id, patch) {
  const current = await getTicket(id);
  if (!current) return null;
  const updated = { ...current, ...patch };
  await kv.set(`kios:queue:${id}`, updated);
  return updated;
}

async function listTodayTickets() {
  const { start, end } = dayRangeWIB(todayWIB());
  const ids = await kv.zrange(QUEUE_INDEX_KEY, start, end, { byScore: true });
  if (!ids.length) return [];
  const tickets = await Promise.all(ids.map((id) => getTicket(id)));
  return tickets.filter(Boolean).sort((a, b) => a.createdAt - b.createdAt);
}

async function deleteTickets(ids) {
  if (!ids.length) return;
  await Promise.all(ids.map((id) => kv.del(`kios:queue:${id}`)));
  await kv.zrem(QUEUE_INDEX_KEY, ...ids);
}

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

async function getCustomer(phone) {
  const key = normalizePhone(phone);
  if (!key) return null;
  return kv.get(`kios:customer:${key}`);
}

async function recordCompletedTransaction(ticket) {
  const key = normalizePhone(ticket.customerPhone);
  if (!key) return null;
  const current = await kv.get(`kios:customer:${key}`);
  const volumeIDR = ticket.type === 'rub_to_idr' ? (ticket.baseAmountIDR || 0) : (ticket.amount || 0);
  const updated = {
    phone: ticket.customerPhone,
    name: ticket.customerName || (current && current.name) || '',
    totalTx: ((current && current.totalTx) || 0) + 1,
    totalVolumeIDR: ((current && current.totalVolumeIDR) || 0) + volumeIDR,
    firstSeen: (current && current.firstSeen) || ticket.createdAt,
    lastSeen: Date.now(),
  };
  await kv.set(`kios:customer:${key}`, updated);
  return updated;
}

async function resetTodayCounters() {
  const date = todayWIB();
  await kv.del(`kios:counter:J:${date}`);
  await kv.del(`kios:counter:B:${date}`);
}

module.exports = {
  todayWIB, getSettings, setSettings, nextQueueNumber,
  createTicket, getTicket, updateTicket, listTodayTickets, deleteTickets,
  normalizePhone, getCustomer, recordCompletedTransaction, resetTodayCounters,
};
