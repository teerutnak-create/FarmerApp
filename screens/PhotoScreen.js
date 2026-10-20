import { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Image, Alert, StyleSheet, SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { s } from '../styles';
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
    } catch (e) {}
    setBusy(false);

    setPhoto({ uri: result.assets[0].uri, takenAt, lat, lng, accuracy });
  };

  const save = () => {
    if (!plot) return Alert.alert('ยังไม่ครบ', 'กรุณาเลือกแปลง');
    if (!photo) return Alert.alert('ยังไม่ครบ', 'กรุณาถ่ายรูปก่อน');

    const hasGps = photo.lat !== null;
    onSave('ถ่ายรูปแปลง', {
      plot,
      photoUri: photo.uri,
      photoTime: photo.takenAt,
      lat: photo.lat,
      lng: photo.lng,
      accuracy: photo.accuracy,
      summary: 'ถ่ายรูป ' + plot + (hasGps ? ' · มีพิกัด' : ' · ไม่มีพิกัด'),
    });
    Alert.alert('บันทึกแล้ว ✅', hasGps ? 'บันทึกรูปพร้อมพิกัด' : 'บันทึกรูป (ไม่มีพิกัด GPS)', [
      { text: 'ตกลง', onPress: onClose },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f3f0ff' }}>
      <ScrollView contentContainerStyle={s.page}>
        <TouchableOpacity onPress={onClose}><Text style={s.logout}>← กลับ</Text></TouchableOpacity>
        <Text style={s.title}>📷 ถ่ายรูปแปลงนา</Text>

        <Text style={p.q}>แปลงไหน</Text>
        <View style={p.wrap}>
          {PLOTS.map((x) => (
            <TouchableOpacity key={x} style={[p.chip, plot === x && p.chipOn]} onPress={() => setPlot(x)}>
              <Text style={[p.chipText, plot === x && p.chipTextOn]}>{x}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[s.bigBtn, { backgroundColor: '#6d28d9', marginTop: 10 }]} onPress={takePhoto} disabled={busy}>
          <Text style={s.bigBtnText}>
            {busy ? '⏳ กำลังหาพิกัด...' : photo ? '📷 ถ่ายใหม่' : '📷 ถ่ายรูป'}
          </Text>
        </TouchableOpacity>

        {photo && (
          <View style={{ marginTop: 16 }}>
            <Image source={{ uri: photo.uri }} style={p.image} />
            <Text style={p.info}>🕒 {new Date(photo.takenAt).toLocaleString('th-TH')}</Text>
            {photo.lat !== null ? (
              <Text style={p.info}>
                📍 {photo.lat.toFixed(5)}, {photo.lng.toFixed(5)} (คลาดเคลื่อน ~{Math.round(photo.accuracy)} ม.)
              </Text>
            ) : (
              <Text style={[p.info, { color: '#b45309' }]}>
                ⚠️ ไม่ได้พิกัด GPS (ลองออกไปที่โล่งแล้วถ่ายใหม่)
              </Text>
            )}
          </View>
        )}

        <TouchableOpacity style={[s.bigBtn, { backgroundColor: '#1d1b54', marginTop: 20 }]} onPress={save}>
          <Text style={s.bigBtnText}>💾 บันทึก</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const p = StyleSheet.create({
  q: { fontSize: 18, fontWeight: 'bold', marginTop: 12, marginBottom: 8, color: '#1d1b54' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#ddd6fe', backgroundColor: '#fff',
    marginRight: 8, marginBottom: 8,
  },
  chipOn: { backgroundColor: '#6b52ae', borderColor: '#6b52ae' },
  chipText: { fontSize: 15, color: '#4c1d95' },
  chipTextOn: { color: '#fff', fontWeight: 'bold' },
  image: { width: '100%', height: 260, borderRadius: 16, backgroundColor: '#eee' },
  info: { fontSize: 14, marginTop: 6, color: '#374151' },
});