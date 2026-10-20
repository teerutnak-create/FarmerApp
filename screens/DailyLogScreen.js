import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';

export default function DailyLogScreen({ onSave, onClose }) {
  const [selectedWater, setSelectedWater] = useState('');
  const [selectedFertilizer, setSelectedFertilizer] = useState('');
  const [note, setNote] = useState('');

  const handleSave = () => {
    // รวบรวมข้อมูลหมวดหมู่ที่เลือก
    const categories = [];
    if (selectedWater) categories.push(`การรดน้ำ: ${selectedWater}`);
    if (selectedFertilizer) categories.push(`การใส่ปุ๋ย: ${selectedFertilizer}`);

    if (categories.length === 0 && !note.trim()) {
      const msg = 'กรุณาเลือกรายการย่อยหรือกรอกรายละเอียดเพิ่มเติมก่อนบันทึก';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('แจ้งเตือน', msg);
      }
      return;
    }

    const logData = {
      water: selectedWater,
      fertilizer: selectedFertilizer,
      note: note.trim(),
      timestamp: new Date().toISOString(),
    };

    if (onSave) {
      onSave('กิจกรรมประจำวัน', logData);
    }

    const successMsg = `บันทึกข้อมูลเรียบร้อยแล้ว! ✅\n(${categories.length} หมวดรายการ)`;

    // 🟢 รองรับ Pop-up ทั้งบน Web และ Mobile
    if (Platform.OS === 'web') {
      window.alert(successMsg);
      if (onClose) onClose();
    } else {
      Alert.alert('บันทึกสำเร็จ ✅', successMsg, [
        { text: 'ตกลง', onPress: () => onClose && onClose() },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Text style={styles.backText}>◀ ย้อนกลับ</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>📝 บันทึกกิจกรรมประจำวัน</Text>
        </View>

        {/* หมวดหมู่การรดน้ำ */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📌 รายการย่อยตามหมวดหมู่</Text>
          <Text style={styles.subTitle}>• การรดน้ำ</Text>
          <View style={styles.chipGroup}>
            {['รดน้ำเช้า', 'รดน้ำเย็น', 'รดน้ำรอบพิเศษ', 'งดรดน้ำ (ฝนตก)', 'ระบบสปริงเกอร์', 'ระบบน้ำหยด'].map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.chip, selectedWater === item && styles.chipActive]}
                onPress={() => setSelectedWater(selectedWater === item ? '' : item)}
              >
                <Text style={[styles.chipText, selectedWater === item && styles.chipTextActive]}>
                  {selectedWater === item ? `✓ ${item}` : item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* หมวดหมู่การใส่ปุ๋ย */}
          <Text style={[styles.subTitle, { marginTop: 12 }]}>• การใส่ปุ๋ย</Text>
          <View style={styles.chipGroup}>
            {['ใส่ปุ๋ยคอก/ปุ๋ยหมัก', 'ใส่ปุ๋ยเคมีสูตรเสมอ 16-16-16', 'ใส่ปุ๋ยสูตรเร่งดอก/ผล', 'พ่นปุ๋ยทางใบ/ฮอร์โมน'].map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.chip, selectedFertilizer === item && styles.chipActive]}
                onPress={() => setSelectedFertilizer(selectedFertilizer === item ? '' : item)}
              >
                <Text style={[styles.chipText, selectedFertilizer === item && styles.chipTextActive]}>
                  {selectedFertilizer === item ? `✓ ${item}` : item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* รายละเอียดเพิ่มเติม */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📝 รายละเอียดเพิ่มเติม / หมายเหตุ</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            placeholder="พิมพ์รายละเอียดเพิ่มเติม..."
            value={note}
            onChangeText={setNote}
          />
        </View>

        {/* ปุ่มบันทึก */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>
            💾 บันทึกข้อมูล ({selectedWater ? 1 : 0} หมวดน้ำ / {selectedFertilizer ? 1 : 0} หมวดปุ๋ย)
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f8e9' },
  content: { padding: 16, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  backBtn: { backgroundColor: '#e8f5e9', padding: 8, borderRadius: 8, marginRight: 12 },
  backText: { color: '#2e7d32', fontWeight: 'bold', fontSize: 12 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#2e7d32' },
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 14, elevation: 1 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#2e7d32', marginBottom: 8 },
  subTitle: { fontSize: 11, fontWeight: 'bold', color: '#1b5e20', marginBottom: 6 },
  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  chipActive: { backgroundColor: '#dcfce7', borderColor: '#22c55e' },
  chipText: { fontSize: 11, color: '#424242' },
  chipTextActive: { color: '#15803d', fontWeight: 'bold' },
  textArea: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    fontSize: 12,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  saveBtn: {
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
});