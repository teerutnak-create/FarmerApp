import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { USERS } from '../data/users';

const USERS_STORAGE_KEY = 'farmerapp_local_users_v1';
const SESSION_STORAGE_KEY = 'farmerapp_local_session_v1';
const DEFAULT_GROUP_ID = 'pakmai';
const DEFAULT_GROUP_NAME = 'กลุ่มวิสาหกิจชุมชน ต.ผักไหม';

const getStorage = () => {
  if (Platform.OS !== 'web') return AsyncStorage;
  if (typeof window === 'undefined') throw new Error('พื้นที่จัดเก็บในเว็บยังไม่พร้อมใช้งาน');
  return window.localStorage;
};

const readJson = async (key, fallback) => {
  const raw = await getStorage().getItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`ข้อมูลบัญชีในเครื่องเสียหาย (${key}): ${error.message}`);
  }
};

const writeJson = async (key, value) => {
  await getStorage().setItem(key, JSON.stringify(value));
};

export const normalizeLoginIdentifier = (value) => {
  const identifier = String(value || '').trim().toLowerCase().replace(/[\s()-]/g, '');
  if (!/^[a-z0-9][a-z0-9._+-]{2,63}$/.test(identifier)) {
    throw new Error('กรุณาตรวจสอบเบอร์โทรศัพท์หรือรหัสประจำตัว');
  }
  return identifier;
};

const normalizeDateOfBirth = (value) => {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(value || '').trim());
  if (!match) throw new Error('รูปแบบวันเดือนปีเกิดไม่ถูกต้อง');

  const day = Number(match[1]);
  const month = Number(match[2]);
  const enteredYear = Number(match[3]);
  const year = enteredYear >= 2400 ? enteredYear - 543 : enteredYear;
  const date = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date > today
  ) {
    throw new Error('วันเดือนปีเกิดไม่ถูกต้อง');
  }

  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${enteredYear}`;
};

const getStoredUsers = async () => {
  const users = await readJson(USERS_STORAGE_KEY, []);
  if (!Array.isArray(users)) throw new Error('รายการบัญชีในเครื่องไม่ถูกต้อง');
  return users;
};

const toPublicUser = (user) => ({
  id: user.id,
  name: user.name,
  login: user.login,
  phone: user.phone,
  dob: user.dob,
  role: user.role,
  groupId: user.groupId,
  groupName: user.groupName,
  isDemo: Boolean(user.isDemo),
  isLocal: !user.isDemo,
});

const saveSession = async () => {
  await getStorage().removeItem(SESSION_STORAGE_KEY);
};

const hashPassword = (salt, password) =>
  Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${password}`
  );

export const signIn = async (loginIdentifier, password) => {
  const login = normalizeLoginIdentifier(loginIdentifier);

  const demoUser = USERS.find(
    (candidate) =>
      candidate.login.toLowerCase() === login &&
      candidate.pin === password
  );
  if (demoUser) {
    const user = {
      ...demoUser,
      phone: demoUser.login,
      groupId: DEFAULT_GROUP_ID,
      groupName: DEFAULT_GROUP_NAME,
      isDemo: true,
    };
    await saveSession(user);
    return toPublicUser(user);
  }

  const users = await getStoredUsers();
  const storedUser = users.find((candidate) => candidate.login === login);
  if (!storedUser || !storedUser.passwordSalt || !storedUser.passwordHash) {
    throw new Error('เบอร์โทร/รหัสเจ้าหน้าที่ หรือรหัสผ่านไม่ถูกต้อง');
  }

  const passwordHash = await hashPassword(storedUser.passwordSalt, String(password || ''));
  if (passwordHash !== storedUser.passwordHash) {
    throw new Error('เบอร์โทร/รหัสเจ้าหน้าที่ หรือรหัสผ่านไม่ถูกต้อง');
  }

  await saveSession(storedUser);
  return toPublicUser(storedUser);
};

export const signUp = async ({ name, phone, dob, password, role }) => {
  const fullName = String(name || '').trim();
  const login = normalizeLoginIdentifier(phone);
  const normalizedDob = normalizeDateOfBirth(dob);
  const normalizedRole = role === 'officer' ? 'officer' : role === 'farmer' ? 'farmer' : null;

  if (!fullName) throw new Error('กรุณากรอกชื่อ-นามสกุล');
  if (String(password || '').length < 6) throw new Error('รหัสผ่านต้องมีอย่างน้อย 6 หลัก');
  if (!normalizedRole) throw new Error('กรุณาเลือกสิทธิ์บัญชีให้ถูกต้อง');
  if (USERS.some((user) => user.login.toLowerCase() === login)) {
    throw new Error('เบอร์โทร/รหัสนี้เป็นบัญชีทดลองและไม่สามารถสมัครซ้ำได้');
  }

  const users = await getStoredUsers();
  if (users.some((user) => user.login === login)) {
    throw new Error('เบอร์โทร/รหัสนี้มีอยู่ในเครื่องแล้ว');
  }

  const passwordSalt = Crypto.randomUUID();
  const user = {
    id: Crypto.randomUUID(),
    name: fullName,
    login,
    phone: login,
    dob: normalizedDob,
    groupId: DEFAULT_GROUP_ID,
    groupName: DEFAULT_GROUP_NAME,
    role: normalizedRole,
    passwordSalt,
    passwordHash: await hashPassword(passwordSalt, String(password)),
    isDemo: false,
    createdAt: new Date().toISOString(),
  };

  await writeJson(USERS_STORAGE_KEY, [...users, user]);
  await saveSession(user);
  return toPublicUser(user);
};

export const restoreLocalSession = async () => {
  await getStorage().removeItem(SESSION_STORAGE_KEY);
  return null;
};

export const signOutLocal = async () => {
  await getStorage().removeItem(SESSION_STORAGE_KEY);
};
