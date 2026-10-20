import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { PLOTS } from '../data/options';

export default function PhotoScreen({ onSave, onClose }) {
  const [plot, setPlot] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);

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
      photoUri: photo.uri,
      photoTime: photo.takenAt,
      lat: photo.lat,
      lng: photo.lng,
      accuracy: photo.accuracy,
      summary: `ถ่ายรูป ${plot}${hasGps ? ' · มีพิกัด GPS' : ' · ไม่มีพิกัด GPS'}`,
    });

    Alert.alert(
      'บันทึกสำเร็จ! ✅',
      hasGps ? 'บันทึกรูปถ่ายพร้อมพิกัด GPS เรียบร้อยแล้ว' : 'บันทึกรูปถ่ายเรียบร้อยแล้ว (ไม่มีพิกัด GPS)',
      [
        {
          text: 'ตกลง',
          onPress: () => onClose?.(),
        },
      ],
      { cancelable: false }
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
          <Text style={styles.cardTitle}>📍 เลือกแปลงนา</Text>
          <View style={styles.chipContainer}>
            {PLOTS.map((x) => {
              const isSelected = plot === x;
              return (
                <TouchableOpacity
                  key={x}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => setPlot(x)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {x}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Card 2: ถ่ายรูป & พรีวิว */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📷 รูปถ่ายแปลงนา</Text>

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