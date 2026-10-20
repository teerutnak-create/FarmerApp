import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { s } from '../styles';
import { PLOTS } from '../data/options';
import { CROPS, SEED_SOURCES, RICE_TARGET } from '../data/profile';

export default function YieldScreen({ user, onSave, onClose }) {
  const [plot, setPlot] = useState(null);
  const [crop, setCrop] = useState(null);
  const [seed, setSeed] = useState(null);
  const [kg, setKg] = useState(400);

  const save = () => {
    if (!plot) return Alert.alert('กรอกข้อมูลไม่ครบ', 'กรุณาเลือกแปลงนา');
    if (!crop) return Alert.alert('กรอกข้อมูลไม่ครบ', 'กรุณาเลือกชนิดพืชที่ปลูก');
    if (!seed) return Alert.alert('กรอกข้อมูลไม่ครบ', 'กรุณาเลือกแหล่งเมล็ดพันธุ์');

    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const lot = 'LOT-' + user.id.toUpperCase() + '-' + date + '-' + (PLOTS.indexOf(plot) + 1);

    onSave('ผลผลิต', {
      plot, crop, seedSource: seed, kgPerRai: kg, lot,
      summary: 'ผลผลิต ' + crop + ' · ' + plot + ' · ' + kg + ' กก./ไร่ · ' + lot,
    });
    Alert.alert('บันทึกสำเร็จ ✅', 'เลขล็อตสินค้าของท่านคือ: ' + lot, [{ text: 'ตกลง', onPress: onClose }]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f3f0ff' }}>
      <StatusBar barStyle="light-content" backgroundColor="#1d1b54" />

      <View style={senior.topBar}>
        <TouchableOpacity onPress={onClose} style={senior.backBtn}>
          <Text style={senior.backBtnText}>← ย้อนกลับ</Text>
        </TouchableOpacity>
        <Text style={senior.topTitle}>📦 บันทึกผลผลิตข้าว</Text>
      </View>

      <ScrollView contentContainerStyle={senior.container} showsVerticalScrollIndicator={false}>
        
        {/* ข้อ 1: แปลงนา */}
        <View style={senior.card}>
          <Text style={senior.cardTitle}>1. เลือกแปลงนา</Text>
          <View style={senior.chipGroup}>
            {PLOTS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[senior.chip, plot === p && senior.chipActive]}
                onPress={() => setPlot(p)}
              >
                <Text style={[senior.chipText, plot === p && senior.chipTextActive]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ข้อ 2: ชนิดพืช */}
        <View style={senior.card}>
          <Text style={senior.cardTitle}>2. ชนิดพืช/พันธุ์ข้าว</Text>
          <View style={senior.chipGroup}>
            {CROPS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[senior.chip, crop === c && senior.chipActive]}
                onPress={() => setCrop(c)}
              >
                <Text style={[senior.chipText, crop === c && senior.chipTextActive]}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ข้อ 3: เมล็ดพันธุ์ */}
        <View style={senior.card}>
          <Text style={senior.cardTitle}>3. เมล็ดพันธุ์ได้มาจากไหน</Text>
          <View style={senior.chipGroup}>
            {SEED_SOURCES.map((x) => (
              <TouchableOpacity
                key={x}
                style={[senior.chip, seed === x && senior.chipActive]}
                onPress={() => setSeed(x)}
              >
                <Text style={[senior.chipText, seed === x && senior.chipTextActive]}>
                  {x}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ข้อ 4: จำนวนผลผลิต */}
        <View style={senior.card}>
          <Text style={senior.cardTitle}>4. ผลผลิตที่ได้ (กิโลกรัมต่อไร่)</Text>
          <View style={senior.stepperContainer}>
            <TouchableOpacity
              style={senior.stepBtn}
              onPress={() => setKg(Math.max(10, kg - 10))}
            >
              <Text style={senior.stepBtnText}>− 10</Text>
            </TouchableOpacity>

            <View style={senior.stepperValueBox}>
              <Text style={senior.stepperNumber}>{kg}</Text>
              <Text style={senior.stepperUnit}>กก./ไร่</Text>
            </View>

            <TouchableOpacity
              style={senior.stepBtn}
              onPress={() => setKg(kg + 10)}
            >
              <Text style={senior.stepBtnText}>+ 10</Text>
            </TouchableOpacity>
          </View>

          {crop === 'ข้าวหอมมะลิ' && (
            <Text style={{ marginTop: 10, color: '#6b7280', fontSize: 14, textAlign: 'center' }}>
              💡 เป้าหมายมาตรฐาน: {RICE_TARGET.min}–{RICE_TARGET.max} กก./ไร่
            </Text>
          )}
        </View>

        <TouchableOpacity style={senior.saveBigBtn} onPress={save}>
          <Text style={senior.saveBigBtnText}>💾 บันทึกผลผลิต</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// สไตล์พิเศษเน้นความชัดเจนสำหรับผู้สูงอายุ
const senior = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  topBar: {
    height: 60,
    backgroundColor: '#1d1b54',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    marginRight: 12,
  },
  backBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
  topTitle: { color: '#ffffff', fontWeight: 'bold', fontSize: 18 },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1d1b54',
    marginBottom: 14,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  chipActive: {
    backgroundColor: '#6b52ae',
    borderColor: '#6b52ae',
  },
  chipText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },

  // Stepper ปุ่มบวกลบใหญ่
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  stepBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#6b52ae',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  stepperValueBox: {
    alignItems: 'center',
  },
  stepperNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1d1b54',
  },
  stepperUnit: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },

  // ปุ่มบันทึกใหญ่พิเศษ
  saveBigBtn: {
    backgroundColor: '#1d1b54',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    elevation: 3,
  },
  saveBigBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});