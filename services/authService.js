import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import { USERS } from '../data/users';
import { supabase } from '../supabase';

const PROFILE_CACHE_PREFIX = 'supabase_profile_v1:';
const GROUP_PROFILES_CACHE_PREFIX = 'supabase_group_profiles_v1:';
const AUTH_ALIAS_DOMAIN = 'login.farmerapp.invalid';

const canUseDemoAccounts = () => typeof __DEV__ !== 'undefined' && __DEV__;

export const normalizeLoginIdentifier = (value) => {
  const identifier = String(value || '').trim().toLowerCase().replace(/[\s()-]/g, '');
  if (!/^[a-z0-9][a-z0-9._+-]{2,63}$/.test(identifier)) {
    throw new Error('กรุณาตรวจสอบเบอร์โทรศัพท์หรือรหัสประจำตัว');
  }
  return identifier;
};

const toAuthEmail = (identifier) => `${normalizeLoginIdentifier(identifier)}@${AUTH_ALIAS_DOMAIN}`;

const toIsoDate = (dob) => {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(dob || '').trim());
  if (!match) throw new Error('รูปแบบวันเดือนปีเกิดไม่ถูกต้อง');

  const day = Number(match[1]);
  const month = Number(match[2]);
  const enteredYear = Number(match[3]);
  const year = enteredYear >= 2400 ? enteredYear - 543 : enteredYear;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error('วันเดือนปีเกิดไม่ถูกต้อง');
  }

  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const fromIsoDate = (value) => {
  if (!value) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  return `${match[3]}/${match[2]}/${Number(match[1]) + 543}`;
};

const mapProfile = (profile) => ({
  id: profile.id,
  name: profile.full_name,
  login: profile.login_identifier,
  phone: profile.phone || '',
  dob: fromIsoDate(profile.date_of_birth),
  role: profile.role,
  groupId: profile.group_id,
  groupName: profile.group_name,
  isDemo: false,
});

const getProfileCacheKey = (userId) => `${PROFILE_CACHE_PREFIX}${userId}`;
const getGroupProfilesCacheKey = (userId) => `${GROUP_PROFILES_CACHE_PREFIX}${userId}`;

const fetchProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, login_identifier, date_of_birth, group_id, group_name, role')
    .eq('id', userId)
    .single();

  if (error) throw error;
  if (!data) throw new Error('ไม่พบข้อมูลโปรไฟล์ของบัญชีนี้');
  return mapProfile(data);
};

const getProfileWithCache = async (userId) => {
  try {
    const profile = await fetchProfile(userId);
    await AsyncStorage.setItem(getProfileCacheKey(userId), JSON.stringify(profile));
    return profile;
  } catch (error) {
    const cached = await AsyncStorage.getItem(getProfileCacheKey(userId));
    const network = await Network.getNetworkStateAsync();
    if (cached && (network.isConnected === false || network.isInternetReachable === false)) {
      console.warn('Using cached profile while Supabase is unavailable:', error);
      return JSON.parse(cached);
    }
    throw error;
  }
};

export const signIn = async (loginIdentifier, password) => {
  const normalizedIdentifier = normalizeLoginIdentifier(loginIdentifier);

  if (canUseDemoAccounts()) {
    const demoUser = USERS.find(
      (candidate) =>
        candidate.login.toLowerCase() === normalizedIdentifier &&
        candidate.pin === password
    );
    if (demoUser) {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      return {
        ...demoUser,
        groupId: 'pakmai',
        groupName: 'กลุ่มวิสาหกิจชุมชน ต.ผักไหม',
        isDemo: true,
      };
    }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: toAuthEmail(normalizedIdentifier),
    password,
  });
  if (error) throw error;
  if (!data.user) throw new Error('เข้าสู่ระบบไม่สำเร็จ');
  return getProfileWithCache(data.user.id);
};

export const signUp = async ({ name, phone, dob, password }) => {
  if (String(password || '').length < 6) {
    throw new Error('รหัสผ่านต้องมีอย่างน้อย 6 หลัก');
  }
  const loginIdentifier = normalizeLoginIdentifier(phone);
  const dateOfBirth = toIsoDate(dob);
  const { data, error } = await supabase.auth.signUp({
    email: toAuthEmail(loginIdentifier),
    password,
    options: {
      data: {
        full_name: String(name || '').trim(),
        phone: loginIdentifier,
        login_identifier: loginIdentifier,
        date_of_birth: dateOfBirth,
      },
    },
  });

  if (error) throw error;
  if (!data.session || !data.user) {
    throw new Error(
      'บัญชีถูกสร้างแล้ว แต่ยังไม่ได้รับ session ให้ปิดการยืนยันอีเมลใน Supabase Auth สำหรับบัญชี alias แล้วลองเข้าสู่ระบบ'
    );
  }

  return getProfileWithCache(data.user.id);
};

export const restoreSessionUser = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session?.user?.id) return null;
  return getProfileWithCache(data.session.user.id);
};

export const listGroupFarmers = async (officerId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone, login_identifier, date_of_birth, group_id, group_name, role')
      .eq('role', 'farmer')
      .order('full_name');
    if (error) throw error;

    const farmers = (data || []).map(mapProfile);
    await AsyncStorage.setItem(getGroupProfilesCacheKey(officerId), JSON.stringify(farmers));
    return farmers;
  } catch (error) {
    const cached = await AsyncStorage.getItem(getGroupProfilesCacheKey(officerId));
    const network = await Network.getNetworkStateAsync();
    if (cached && (network.isConnected === false || network.isInternetReachable === false)) {
      console.warn('Using cached group profiles while Supabase is unavailable:', error);
      return JSON.parse(cached);
    }
    throw error;
  }
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
