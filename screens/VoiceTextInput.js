import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function VoiceTextInput({
  value,
  onChangeText,
  fieldKey,
  disabled,
  onListeningChange,
}) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const nativeVoiceRef = useRef(null);
  const valueRef = useRef(value);
  const voiceBaseRef = useRef('');
  const isListeningRef = useRef(false);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => () => {
    if (recognitionRef.current) {
      const recognition = recognitionRef.current;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.abort();
      } catch (error) {
        console.warn('Unable to stop speech recognition:', error);
      }
      recognitionRef.current = null;
    }

    if (nativeVoiceRef.current) {
      const voice = nativeVoiceRef.current;
      voice.onSpeechResults = undefined;
      voice.onSpeechPartialResults = undefined;
      voice.onSpeechEnd = undefined;
      voice.onSpeechError = undefined;
      nativeVoiceRef.current = null;
      voice.destroy().catch((error) => {
        console.warn('Unable to release voice recognition:', error);
      });
    }
  }, []);

  const setVoiceListening = (listening) => {
    isListeningRef.current = listening;
    setIsListening(listening);
    onListeningChange(fieldKey, listening);
  };

  const updateTranscript = (transcript) => {
    const text = [voiceBaseRef.current, transcript.trim()].filter(Boolean).join(' ');
    valueRef.current = text;
    onChangeText(text);
  };

  const handleVoiceTyping = async () => {
    if (isListening) {
      try {
        if (Platform.OS === 'web' && recognitionRef.current) {
          recognitionRef.current.stop();
          return;
        }
        if (nativeVoiceRef.current) {
          await nativeVoiceRef.current.stop();
        }
        setVoiceListening(false);
      } catch (error) {
        setVoiceListening(false);
        Alert.alert('หยุดรับเสียงไม่สำเร็จ', error?.message || 'กรุณาลองอีกครั้ง');
      }
      return;
    }

    voiceBaseRef.current = valueRef.current.trim();
    setVoiceListening(true);

    if (Platform.OS === 'web') {
      const SpeechRecognition =
        typeof window !== 'undefined' &&
        (window.SpeechRecognition || window.webkitSpeechRecognition);

      if (!SpeechRecognition) {
        setVoiceListening(false);
        Alert.alert('ไม่รองรับ', 'เบราว์เซอร์นี้ไม่รองรับการรู้จำเสียง แนะนำให้ใช้ Google Chrome');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'th-TH';
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i += 1) {
          transcript += `${event.results[i][0].transcript} `;
        }
        if (transcript.trim()) updateTranscript(transcript);
      };
      recognition.onerror = (event) => {
        setVoiceListening(false);
        if (event.error !== 'aborted') {
          Alert.alert('จับเสียงไม่สำเร็จ', 'กรุณาอนุญาตใช้ไมโครโฟนแล้วลองอีกครั้ง');
        }
      };
      recognition.onend = () => {
        recognitionRef.current = null;
        setVoiceListening(false);
      };
      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (error) {
        recognitionRef.current = null;
        setVoiceListening(false);
        Alert.alert('เริ่มรับเสียงไม่สำเร็จ', error?.message || 'กรุณาลองอีกครั้ง');
      }
      return;
    }

    try {
      const Voice = require('@react-native-voice/voice').default;
      nativeVoiceRef.current = Voice;
      Voice.onSpeechResults = (event) => {
        if (isListeningRef.current && event.value?.[0]) updateTranscript(event.value[0]);
      };
      Voice.onSpeechPartialResults = (event) => {
        if (isListeningRef.current && event.value?.[0]) updateTranscript(event.value[0]);
      };
      Voice.onSpeechEnd = () => setVoiceListening(false);
      Voice.onSpeechError = (event) => {
        setVoiceListening(false);
        Alert.alert('จับเสียงไม่สำเร็จ', event.error || 'กรุณาอนุญาตใช้ไมโครโฟนแล้วลองอีกครั้ง');
      };

      const available = await Voice.isAvailable();
      if (!available) {
        setVoiceListening(false);
        Alert.alert('ไม่รองรับ', 'อุปกรณ์นี้ไม่รองรับการรู้จำเสียง');
        return;
      }
      if (isListeningRef.current) await Voice.start('th-TH');
    } catch (error) {
      setVoiceListening(false);
      Alert.alert('เริ่มรับเสียงไม่สำเร็จ', error?.message || 'กรุณาตรวจสอบสิทธิ์ไมโครโฟนแล้วลองอีกครั้ง');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>ข้อความเสียง (ถ้ามี)</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={(text) => {
          valueRef.current = text;
          onChangeText(text);
        }}
        placeholder="พิมพ์หรือกดพูดเพื่อบันทึกข้อความ"
        placeholderTextColor="#94a3b8"
        multiline
        textAlignVertical="top"
      />
      <TouchableOpacity
        style={[styles.voiceButton, isListening && styles.voiceButtonActive, disabled && styles.voiceButtonDisabled]}
        onPress={handleVoiceTyping}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Text style={styles.voiceButtonText}>
          {isListening ? '⏹️ หยุดพูด' : '🎙️ พูดเพื่อพิมพ์'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  label: {
    marginBottom: 6,
    color: '#14532d',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    minHeight: 64,
    padding: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 10,
    backgroundColor: '#f0fdf4',
    color: '#14532d',
    fontSize: 14,
  },
  voiceButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#15803d',
  },
  voiceButtonActive: {
    backgroundColor: '#dc2626',
  },
  voiceButtonDisabled: {
    opacity: 0.5,
  },
  voiceButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
