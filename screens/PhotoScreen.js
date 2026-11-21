import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { PLOTS } from '../data/options';
import { notify } from '../utils/notify';
import ReadAloudLabel from '../components/ReadAloudLabel';

export default function PhotoScreen({ onSave, onClose }) {
  const [plot, setPlot] = useState(null);
  const [voiceText, setVoiceText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const speechRecognitionRef = useRef(null);
  const nativeVoiceRef = useRef(null);
  const voiceTextRef = useRef('');
  const voiceBaseRef = useRef('');

  useEffect(() => () => {
    if (speechRecognitionRef.current) {
      const recognition = speechRecognitionRef.current;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.abort();
      } catch (error) {
        console.warn('Unable to stop speech recognition:', error);
      }
      speechRecognitionRef.current = null;
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

  const updateVoiceText = (text) => {
    voiceTextRef.current = text;
    setVoiceText(text);
  };

  const applyTranscript = (transcript) => {
    const text = [voiceBaseRef.current, transcript.trim()].filter(Boolean).join(' ');
    updateVoiceText(text);
  };

  const handleVoiceTyping = async () => {
    if (isListening) {
      try {
        if (Platform.OS === 'web' && speechRecognitionRef.current) {
          speechRecognitionRef.current.stop();
          return;
        } else if (nativeVoiceRef.current) {
          await nativeVoiceRef.current.stop();
        }
        setIsListening(false);
      } catch (error) {
        setIsListening(false);
        Alert.alert('หยุดรับเสียงไม่สำเร็จ', error?.message || 'กรุณาลองอีกครั้ง');
      }
      return;
    }

    voiceBaseRef.current = voiceTextRef.current.trim();
    setIsListening(true);

    if (Platform.OS === 'web') {
      const SpeechRecognition =
        typeof window !== 'undefined' &&
        (window.SpeechRecognition || window.webkitSpeechRecognition);

      if (!SpeechRecognition) {
        setIsListening(false);
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
        if (transcript.trim()) applyTranscript(transcript);
      };
      recognition.onerror = (event) => {
        setIsListening(false);
        if (event.error !== 'aborted') {
          Alert.alert('จับเสียงไม่สำเร็จ', 'กรุณาอนุญาตใช้ไมโครโฟนแล้วลองอีกครั้ง');
        }
      };
      recognition.onend = () => {
        speechRecognitionRef.current = null;
        setIsListening(false);
      };
      speechRecognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (error) {
        speechRecognitionRef.current = null;
        setIsListening(false);
        Alert.alert('เริ่มรับเสียงไม่สำเร็จ', error?.message || 'กรุณาลองอีกครั้ง');
      }
      return;
    }

    try {
      const Voice = require('@react-native-voice/voice').default;
      nativeVoiceRef.current = Voice;
      Voice.onSpeechResults = (event) => {
        if (event.value?.[0]) applyTranscript(event.value[0]);
      };
      Voice.onSpeechPartialResults = (event) => {
        if (event.value?.[0]) applyTranscript(event.value[0]);
      };
      Voice.onSpeechEnd = () => setIsListening(false);
      Voice.onSpeechError = (event) => {
        setIsListening(false);
        Alert.alert('จับเสียงไม่สำเร็จ', event.error || 'กรุณาอนุญาตใช้ไมโครโฟนแล้วลองอีกครั้ง');
      };

      const available = await Voice.isAvailable();
      if (!available) {
        setIsListening(false);
        Alert.alert('ไม่รองรับ', 'อุปกรณ์นี้ไม่รองรับการรู้จำเสียง');
        return;
      }
      await Voice.start('th-TH');
    } catch (error) {
      setIsListening(false);
      Alert.alert('เริ่มรับเสียงไม่สำเร็จ', error?.message || 'กรุณาตรวจสอบสิทธิ์ไมโครโฟนแล้วลองอีกครั้ง');
    }
  };

  const takePhoto = async () => {
    const cam = await ImagePicker.requestCameraPermissionsAsync();
    if (!cam.granted) {
      Alert.alert('ต้องอนุญาตใช้กล้อง', 'ไปที่ ตั้งค่า > Expo Go > เปิดสิทธิ์กล้อง');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.5 });
    if (result.canceled) return;

    const takenAt = new Date().toISOString();

    setBusy(true);
    let lat = null, lng = null, accuracy = null;
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.granted) {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
        accuracy = pos.coords.accuracy;
      }
    } catch (e) {
      console.log('Location error:', e);
    }
    setBusy(false);

    setPhoto({ uri: result.assets[0].uri, takenAt, lat, lng, accuracy });
  };

  const save = () => {
    if (!plot) return Alert.alert('ข้อมูลไม่ครบถ้วน', 'กรุณาเลือกแปลงนาก่อนบันทึก');
    if (!photo) return Alert.alert('ข้อมูลไม่ครบถ้วน', 'กรุณาถ่ายรูปแปลงนาก่อนบันทึก');

    const hasGps = photo.lat !== null;

    onSave('ถ่ายรูปแปลง', {
      plot,
      voiceText: voiceText.trim(),
      photoUri: photo.uri,
      photoTime: photo.takenAt,
      lat: photo.lat,
      lng: photo.lng,
      accuracy: photo.accuracy,
      summary: `ถ่ายรูป ${plot}${hasGps ? ' · มีพิกัด GPS' : ' · ไม่มีพิกัด GPS'}`,
    });

    notify(
      'บันทึกสำเร็จ! ✅',
      hasGps ? 'บันทึกรูปถ่ายพร้อมพิกัด GPS เรียบร้อยแล้ว' : 'บันทึกรูปถ่ายเรียบร้อยแล้ว (ไม่มีพิกัด GPS)',
      onClose
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onClose}>
          <Text style={styles.backText}>← กลับ</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>บันทึกรูปภาพประจำวัน</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Card 1: เลือกแปลง */}
        <View style={styles.card}>
          <ReadAloudLabel
            text="เลือกแปลงนา เพื่อระบุแปลงที่จะถ่ายภาพและบันทึกพิกัด"
            textStyle={[styles.cardTitle, { marginBottom: 0 }]}
            containerStyle={styles.cardTitleRow}
          >
            📍 เลือกแปลงนา
          </ReadAloudLabel>
          <View style={styles.chipContainer}>
            {PLOTS.map((x) => {
              const isSelected = plot === x;
              return (
                <TouchableOpacity
                  key={x}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => setPlot(isSelected ? null : x)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {x}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.voiceTextLabel}>ข้อความเสียง / รายละเอียดเพิ่มเติม</Text>
          <TextInput
            style={styles.voiceTextInput}
            value={voiceText}
            onChangeText={updateVoiceText}
            placeholder="พิมพ์ข้อความบันทึกเสียงหรือรายละเอียดเพิ่มเติม"
            placeholderTextColor="#94a3b8"
            multiline
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.voiceBtn, isListening && styles.voiceBtnActive]}
            onPress={handleVoiceTyping}
            activeOpacity={0.8}
          >
            <Text style={styles.voiceBtnText}>
              {isListening ? '⏹️ หยุดพูด' : '🎙️ พูดเพื่อพิมพ์'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Card 2: ถ่ายรูป & พรีวิว */}
        <View style={styles.card}>
          <ReadAloudLabel
            text="รูปถ่ายแปลงนา ใช้ถ่ายและบันทึกภาพแปลง พร้อมเวลาและพิกัดจีพีเอสเมื่ออนุญาต"
            textStyle={[styles.cardTitle, { marginBottom: 0 }]}
            containerStyle={styles.cardTitleRow}
          >
            📷 รูปถ่ายแปลงนา
          </ReadAloudLabel>

          <TouchableOpacity
            style={[styles.photoBtn, busy && styles.photoBtnDisabled]}
            onPress={takePhoto}
            disabled={busy}
            activeOpacity={0.8}
          >
            {busy ? (
              <View style={styles.row}>
                <ActivityIndicator color="#ffffff" size="small" style={{ marginRight: 8 }} />
                <Text style={styles.photoBtnText}>กำลังค้นหาพิกัด GPS...</Text>
              </View>
            ) : (
              <Text style={styles.photoBtnText}>
                {photo ? '🔄 ถ่ายรูปใหม่' : '📷 เปิดกล้องถ่ายรูป'}
              </Text>
            )}
          </TouchableOpacity>

          {photo && (
            <View style={styles.previewBox}>
              <Image source={{ uri: photo.uri }} style={styles.imagePreview} />

              <View style={styles.metaContainer}>
                <Text style={styles.metaText}>
                  🕒 {new Date(photo.takenAt).toLocaleString('th-TH')}
                </Text>

                {photo.lat !== null ? (
                  <View style={[styles.badge, styles.badgeSuccess]}>
                    <Text style={styles.badgeSuccessText}>
                      📍 {photo.lat.toFixed(5)}, {photo.lng.toFixed(5)} (±{Math.round(photo.accuracy)}m)
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.badge, styles.badgeWarning]}>
                    <Text style={styles.badgeWarningText}>
                      ⚠️ ไม่พบพิกัด GPS (ลองถ่ายกลางแจ้ง)
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        {/* ปุ่มบันทึกข้อมูล */}
        <TouchableOpacity
          style={[
            styles.saveBtn,
            (!plot || !photo) && styles.saveBtnDisabled,
          ]}
          onPress={save}
          disabled={!plot || !photo}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBtnText}>💾 บันทึกข้อมูลประจำวัน</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0fdf4', // สีเขียวอ่อนมินิมอลสบายตา
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#dcfce7',
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backText: {
    fontSize: 16,
    color: '#166534', // สีเขียวเข้ม
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#14532d', // สีเขียวใบไม้
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#dcfce7',
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#14532d',
    marginBottom: 12,
  },
  cardTitleRow: {
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
  },
  chipActive: {
    backgroundColor: '#16a34a', // สีเขียวหลัก
    borderColor: '#16a34a',
  },
  chipText: {
    fontSize: 14,
    color: '#15803d',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  voiceTextLabel: {
    marginTop: 12,
    marginBottom: 6,
    color: '#14532d',
    fontSize: 14,
    fontWeight: '600',
  },
  voiceTextInput: {
    minHeight: 80,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
    color: '#14532d',
    fontSize: 14,
  },
  voiceBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#15803d',
  },
  voiceBtnActive: {
    backgroundColor: '#dc2626',
  },
  voiceBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  photoBtn: {
    backgroundColor: '#15803d', // ปุ่มถ่ายรูปสีเขียว
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBtnDisabled: {
    opacity: 0.7,
  },
  photoBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewBox: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  imagePreview: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  metaContainer: {
    padding: 12,
    backgroundColor: '#ffffff',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#475569',
  },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  badgeSuccess: {
    backgroundColor: '#dcfce7',
  },
  badgeSuccessText: {
    color: '#15803d',
    fontSize: 13,
    fontWeight: '600',
  },
  badgeWarning: {
    backgroundColor: '#fef3c7',
  },
  badgeWarningText: {
    color: '#b45309',
    fontSize: 13,
    fontWeight: '500',
  },
  saveBtn: {
    backgroundColor: '#16a34a', // ปุ่มบันทึกหลัก
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});