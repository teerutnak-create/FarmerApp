import { createClient } from '@supabase/supabase-js';

function sendJson(res, status, body) {
  return res.status(status).json(body);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const sensorToken = process.env.ESP32_SENSOR_TOKEN;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!sensorToken || !supabaseUrl || !serviceRoleKey) {
    return sendJson(res, 503, { error: 'Sensor API is not configured' });
  }

  if (req.headers.authorization !== `Bearer ${sensorToken}`) {
    return sendJson(res, 401, { error: 'Unauthorized sensor' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const deviceId = typeof body.deviceId === 'string' ? body.deviceId.trim() : '';
  const plotId = typeof body.plotId === 'string' ? body.plotId.trim() : null;
  const moisture =
    body.moisture === undefined || body.moisture === null || String(body.moisture).trim() === ''
      ? NaN
      : Number(body.moisture);
  const inputTime = body.recordedAt || body.timestamp;
  const recordedAt = inputTime ? new Date(inputTime) : new Date();

  if (!deviceId || deviceId.length > 100) {
    return sendJson(res, 400, { error: 'deviceId is required and must be 100 characters or fewer' });
  }
  if (plotId && plotId.length > 150) {
    return sendJson(res, 400, { error: 'plotId must be 150 characters or fewer' });
  }
  if (!Number.isFinite(moisture) || moisture < 0 || moisture > 100) {
    return sendJson(res, 400, { error: 'moisture must be a number from 0 to 100 percent' });
  }
  if (Number.isNaN(recordedAt.getTime()) || recordedAt.getTime() > Date.now() + 5 * 60 * 1000) {
    return sendJson(res, 400, { error: 'recordedAt must be a valid time and cannot be in the future' });
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error } = await supabase.from('sensor_readings').insert({
      device_id: deviceId,
      plot_id: plotId || null,
      moisture,
      recorded_at: recordedAt.toISOString(),
    });

    if (error) {
      console.error('Saving ESP32 sensor reading failed:', error);
      return sendJson(res, 500, { error: 'Could not save sensor reading' });
    }

    return sendJson(res, 201, { ok: true, recordedAt: recordedAt.toISOString() });
  } catch (error) {
    console.error('Sensor API failed:', error);
    return sendJson(res, 500, { error: 'Could not save sensor reading' });
  }
}
