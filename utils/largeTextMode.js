import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LARGE_TEXT_KEY = 'plangjai_large_text_mode';
const STYLE_TAG_ID = 'plangjai-large-text-style';

let currentEnabled = false;
const listeners = new Set();

function applyWebLargeText(enabled) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;

  let styleTag = document.getElementById(STYLE_TAG_ID);
  if (enabled) {
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = STYLE_TAG_ID;
      document.head.appendChild(styleTag);
    }
    // ขยายเฉพาะตัวอักษรและช่องกรอกทุกหน้าในแอป (ไม่ทำให้แผนที่หรือกรอบเว็บเพี้ยน และไม่ขยายซ้อนกัน)
    styleTag.textContent = `
      [class*="css-text"], [dir="auto"] {
        zoom: 1.18;
      }
      [class*="css-text"] [class*="css-text"],
      [dir="auto"] [dir="auto"],
      [class*="css-text"] [dir="auto"],
      [dir="auto"] [class*="css-text"] {
        zoom: 1;
      }
      input, textarea {
        zoom: 1.12;
      }
    `;
  } else if (styleTag) {
    styleTag.remove();
  }
}

function notify() {
  listeners.forEach((fn) => fn(currentEnabled));
}

export function getLargeTextMode() {
  return currentEnabled;
}

export async function initLargeTextMode() {
  try {
    let saved = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      saved = window.localStorage.getItem(LARGE_TEXT_KEY);
    }
    if (saved === null) {
      saved = await AsyncStorage.getItem(LARGE_TEXT_KEY);
    }
    currentEnabled = saved === '1' || saved === 'true';
    applyWebLargeText(currentEnabled);
    notify();
  } catch (error) {
    console.warn('Unable to load large text setting:', error);
  }
  return currentEnabled;
}

export async function setLargeTextMode(enabled) {
  currentEnabled = Boolean(enabled);
  applyWebLargeText(currentEnabled);
  notify();

  try {
    const value = currentEnabled ? '1' : '0';
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(LARGE_TEXT_KEY, value);
    }
    await AsyncStorage.setItem(LARGE_TEXT_KEY, value);
  } catch (error) {
    console.warn('Unable to save large text setting:', error);
  }
}

export function subscribeLargeTextMode(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}