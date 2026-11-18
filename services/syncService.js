import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as Network from 'expo-network';
import { Platform } from 'react-native';
import { supabase } from '../supabase';

const LOG_CACHE_PREFIX = 'farm_logs_cache_v1:';
const LOG_QUEUE_PREFIX = 'farm_logs_queue_v1:';
const flushLocks = new Map();

export const createLogId = () => Crypto.randomUUID();

const getStorage = () => {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') throw new Error('Browser storage is unavailable');
    return window.localStorage;
  }
  return null;
};

const readValue = async (key) => {
  const webStorage = getStorage();
  const raw = webStorage ? webStorage.getItem(key) : await AsyncStorage.getItem(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid local sync data for ${key}: ${error.message}`);
  }
};

const writeValue = async (key, value) => {
  const serialized = JSON.stringify(value);
  const webStorage = getStorage();
  if (webStorage) {
    webStorage.setItem(key, serialized);
  } else {
    await AsyncStorage.setItem(key, serialized);
  }
};

const cacheKey = (userId) => `${LOG_CACHE_PREFIX}${userId}`;
const queueKey = (userId) => `${LOG_QUEUE_PREFIX}${userId}`;

const isOnline = async () => {
  const state = await Network.getNetworkStateAsync();
  return state.isConnected === true && state.isInternetReachable !== false;
};

const getQueue = async (userId) => {
  const queue = await readValue(queueKey(userId));
  if (queue === null) return [];
  if (!Array.isArray(queue)) throw new Error('Offline sync queue must be an array');
  return queue;
};

export const saveLogsCache = async (userId, logs) => {
  await writeValue(cacheKey(userId), logs);
};

export const enqueueLogUpsert = async (userId, log) => {
  const queue = await getQueue(userId);
  const nextOperation = {
    id: log.id,
    action: 'upsert',
    log,
    version: Crypto.randomUUID(),
  };
  await writeValue(queueKey(userId), [
    ...queue.filter((operation) => operation.id !== log.id),
    nextOperation,
  ]);
};

export const enqueueLogDelete = async (userId, logId) => {
  const queue = await getQueue(userId);
  await writeValue(queueKey(userId), [
    ...queue.filter((operation) => operation.id !== logId),
    { id: logId, action: 'delete', version: Crypto.randomUUID() },
  ]);
};

const toRecordType = (log) => {
  if (log.category === 'SENSOR' || log.type === 'วัดความชื้น') return 'sensor';
  if (log.type === 'ถ่ายรูปแปลง' || log.photoUri) return 'photo';
  if (log.type === 'วางแผนการปลูกพืช') return 'annual';
  if (log.type === 'ข้อมูลแปลง') return 'plot';
  if (log.type === 'บันทึกผลผลิต') return 'yield';
  if (log.category === 'ACTIVITY' || log.type === 'บันทึกกิจกรรมประจำวัน') return 'daily';
  return 'other';
};

const pushOperation = async (operation) => {
  if (operation.action === 'delete') {
    const { error } = await supabase.from('farm_logs').delete().eq('id', operation.id);
    if (error) throw error;
    return;
  }

  const log = operation.log;
  const { error } = await supabase.rpc('upsert_farm_log', {
    p_id: log.id,
    p_farmer_id: log.farmerId,
    p_record_type: toRecordType(log),
    p_payload: log,
    p_recorded_at: log.time || new Date().toISOString(),
  });
  if (error) throw error;
};

const flushPendingLogsInternal = async (userId) => {
  const queue = await getQueue(userId);
  if (queue.length === 0) return { status: 'synced', pendingCount: 0 };
  if (!(await isOnline())) return { status: 'offline', pendingCount: queue.length };

  for (const operation of queue) {
    try {
      await pushOperation(operation);
    } catch (error) {
      console.warn('Farm log sync is pending:', error);
      const currentQueue = await getQueue(userId);
      return {
        status: 'pending',
        pendingCount: currentQueue.length,
        error,
      };
    }

    const currentQueue = await getQueue(userId);
    const stillCurrent = currentQueue.find(
      (queued) => queued.id === operation.id && queued.version === operation.version
    );
    if (stillCurrent) {
      await writeValue(
        queueKey(userId),
        currentQueue.filter((queued) => queued.version !== operation.version)
      );
    }
  }

  const remaining = await getQueue(userId);
  return {
    status: remaining.length === 0 ? 'synced' : 'pending',
    pendingCount: remaining.length,
  };
};

export const flushPendingLogs = async (userId) => {
  if (flushLocks.has(userId)) return flushLocks.get(userId);
  const flushPromise = flushPendingLogsInternal(userId).finally(() => {
    flushLocks.delete(userId);
  });
  flushLocks.set(userId, flushPromise);
  return flushPromise;
};

const fromDatabaseRow = (row) => ({
  ...row.payload,
  id: row.id,
  farmerId: row.farmer_id,
  recordedBy: row.created_by,
  time: row.recorded_at,
  syncedAt: row.synced_at,
  syncStatus: 'synced',
});

const mergeLogs = (remoteLogs, cachedLogs, queue) => {
  const merged = new Map(remoteLogs.map((log) => [log.id, log]));
  const pendingIds = new Set(queue.map((operation) => operation.id));
  for (const log of cachedLogs) {
    if (!merged.has(log.id) || pendingIds.has(log.id)) {
      merged.set(log.id, {
        ...log,
        ...(pendingIds.has(log.id) ? { syncStatus: 'pending' } : {}),
      });
    }
  }
  for (const operation of queue) {
    if (operation.action === 'delete') merged.delete(operation.id);
    else merged.set(operation.id, { ...operation.log, syncStatus: 'pending' });
  }
  return Array.from(merged.values()).sort(
    (left, right) => Date.parse(right.time || 0) - Date.parse(left.time || 0)
  );
};

export const loadLogs = async (userId) => {
  const cachedLogs = (await readValue(cacheKey(userId))) || [];
  if (!Array.isArray(cachedLogs)) throw new Error('Cached farm logs must be an array');
  const queue = await getQueue(userId);

  if (!(await isOnline())) {
    return {
      logs: mergeLogs([], cachedLogs, queue),
      status: queue.length ? 'offline' : 'offline',
      pendingCount: queue.length,
    };
  }

  const { data, error } = await supabase
    .from('farm_logs')
    .select('id, farmer_id, payload, recorded_at, created_by, synced_at')
    .order('recorded_at', { ascending: false });

  if (error) {
    console.warn('Unable to fetch farm logs from Supabase:', error);
    return {
      logs: mergeLogs([], cachedLogs, queue),
      status: queue.length ? 'pending' : 'error',
      pendingCount: queue.length,
      error,
    };
  }

  const remoteLogs = (data || []).map(fromDatabaseRow);
  const logs = mergeLogs(remoteLogs, cachedLogs, queue);
  await saveLogsCache(userId, logs);
  return {
    logs,
    status: queue.length ? 'pending' : 'synced',
    pendingCount: queue.length,
  };
};
