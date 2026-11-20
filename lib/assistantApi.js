import { Platform } from 'react-native';

const getAssistantApiUrls = () => {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');
  let configuredEndpoint = configuredUrl;
  if (configuredEndpoint && !/\/api\/assistant$/i.test(configuredEndpoint)) {
    configuredEndpoint = /\/api$/i.test(configuredEndpoint)
      ? `${configuredEndpoint}/assistant`
      : `${configuredEndpoint}/api/assistant`;
  }

  if (Platform.OS === 'web') {
    return [...new Set(['/api/assistant', configuredEndpoint].filter(Boolean))];
  }
  if (configuredEndpoint) return [configuredEndpoint];
  throw new Error('ไม่พบ EXPO_PUBLIC_API_URL สำหรับเชื่อมต่อผู้ช่วย AI');
};

export async function requestAssistant(messages, context = '') {
  const urls = getAssistantApiUrls();
  for (let index = 0; index < urls.length; index += 1) {
    const response = await fetch(urls[index], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, context }),
    });

    const text = await response.text();
    if (response.ok) {
      if (!text.trim()) {
        throw new Error('ผู้ช่วย AI ไม่ได้ส่งคำตอบกลับมา');
      }
      return text;
    }

    if (index < urls.length - 1 && [404, 405].includes(response.status)) {
      continue;
    }
    throw new Error(text || `HTTP ${response.status}`);
  }

  throw new Error('ไม่พบ API สำหรับเชื่อมต่อผู้ช่วย AI');
}
