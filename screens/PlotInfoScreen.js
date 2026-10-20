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
import { PLOTS } from '../data/options';
import {
  SOILS,
  CHEM_HISTORY,
  FACILITIES,
  STANDARDS,
  CERT_STANDARDS,
} from '../data/profile';

const DAY = 24 * 3600 * 1000;

export default function PlotInfoScreen({ onSave, onClose }) {
  const [plot, setPlot] = useState(null);
  const [rai, setRai] = useState(5);
  const [soil, setSoil] = useState(null);
  const [chem, setChem] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [standards, setStandards] = useState([]);
  const [months, setMonths] = useState(12);

  const toggle = (list, setList, x) =>
    setList(list.includes(x) ? list.filter((i) => i !== x) : [...list, x]);

  const hasCert = standards.some((x) => CERT_STANDARDS.includes(x));

  const save = () => {
    if (!plot) return Alert.alert('กรอกข้อมูลไม่ครบ', 'กรุณาเลือกแปลงนาของท่าน');
    if (!soil) return Alert.alert('กรอกข้อมูลไม่ครบ', 'กรุณาเลือกชนิดดิน');
    if (!chem) return Alert.alert('กรอกข้อมูลไม่ครบ', 'กรุณาเลือกประวัติการใช้สารเคมี');

    const extra = { plot, rai, soil, chem, facilities, standards };
    if (hasCert) {
      extra.certExpiry = new Date(Date.now() + months * 30 * DAY).toISOString();
    }
    extra.summary =
      'ข้อมูลแปลง · ' + plot + ' · ' + rai + ' ไร่' +
      (standards.length > 0 ? ' · ' + standards.join(', ') : '');

    onSave('ข้อมูลแปลง', extra);
    Alert.alert('บันทึกสำเร็จ ✅', extra.summary, [{ text: 'ตกลง', onPress: onClose }]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f3f0ff' }}>
      <StatusBar barStyle="light-content" backgroundColor="#1d1b54" />

      {/* แถบส่วนหัว */}
      <View style={senior.topBar}>
        <TouchableOpacity onPress={onClose} style={senior.backBtn}>
          <Text style={senior.backBtnText}>← ย้อนกลับ</Text>
        </TouchableOpacity>
        <Text style={senior.topTitle}>🗺️ บันทึกข้อมูลแปลงนา</Text>
      </View>

      <ScrollView contentContainerStyle={senior.container} showsVerticalScrollIndicator={false}>
        
        {/* ข้อ 1: เลือกแปลงนา */}
        <View style={senior.card}>
          <Text style={senior.cardTitle}>1. เลือกแปลงนาของท่าน</Text>
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

        {/* ข้อ 2: ขนาดแปลงนา */}
        <View style={senior.card}>
          <Text style={senior.cardTitle}>2. ขนาดแปลงนา (ไร่)</Text>
          <View style={senior.stepperContainer}>
            <TouchableOpacity
              style={senior.stepBtn}
              onPress={() => setRai(Math.max(0.5, rai - 0.5))}
            >
              <Text style={senior.stepBtnText}>−</Text>
            </TouchableOpacity>

            <View style={senior.stepperValueBox}>
              <Text style={senior.stepperNumber}>{rai}</Text>
              <Text style={senior.stepperUnit}>ไร่</Text>
            </View>

            <TouchableOpacity
              style={senior.stepBtn}
              onPress={() => setRai(rai + 0.5)}
            >
              <Text style={senior.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ข้อ 3: ชนิดดิน */}
        <View style={senior.card}>
          <Text style={senior.cardTitle}>3. ชนิดดินในแปลง</Text>
          <View style={senior.chipGroup}>
            {SOILS.map((x) => (
              <TouchableOpacity
                key={x}
                style={[senior.chip, soil === x && senior.chipActive]}
                onPress={() => setSoil(x)}
              >
                <Text style={[senior.chipText, soil === x && senior.chipTextActive]}>
                  {x}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ข้อ 4: ประวัติสารเคมี */}
        <View style={senior.card}>
          <Text style={senior.cardTitle}>4. ประวัติการใช้สารเคมี</Text>
          <View style={senior.chipGroup}>
            {CHEM_HISTORY.map((x) => (
              <TouchableOpacity
                key={x}
                style={[senior.chip, chem === x && senior.chipActive]}
                onPress={() => setChem(x)}
              >
                <Text style={[senior.chipText, chem === x && senior.chipTextActive]}>
                  {x}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ข้อ 5: สิ่งที่มีในแปลง */}
        <View style={senior.card}>
          <Text style={senior.cardTitle}>5. สิ่งที่มีในแปลง (เลือกได้หลายข้อ)</Text>
          <View style={senior.chipGroup}>
            {FACILITIES.map((x) => (
              <TouchableOpacity
                key={x}
                style={[senior.chip, facilities.includes(x) && senior.chipActive]}
                onPress={() => toggle(facilities, setFacilities, x)}
              >
                <Text style={[senior.chipText, facilities.includes(x) && senior.chipTextActive]}>
                  {facilities.includes(x) ? '✓ ' : ''}{x}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ข้อ 6: มาตรฐานที่มี */}
        <View style={senior.card}>
          <Text style={senior.cardTitle}>6. มาตรฐานรับรอง (เลือกได้หลายข้อ)</Text>
          <View style={senior.chipGroup}>
            {STANDARDS.map((x) => (
              <TouchableOpacity
                key={x}
                style={[senior.chip, standards.includes(x) && senior.chipActive]}
                onPress={() => toggle(standards, setStandards, x)}
              >
                <Text style={[senior.chipText, standards.includes(x) && senior.chipTextActive]}>
                  {standards.includes(x) ? '✓ ' : ''}{x}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {hasCert && (
            <View style={{ marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' }}>
              <Text style={senior.cardTitle}>ใบรับรองหมดอายุในอีก (เดือน)</Text>
              <View style={senior.stepperContainer}>
                <TouchableOpacity
                  style={senior.stepBtn}
                  onPress={() => setMonths(Math.max(1, months - 1))}
                >
                  <Text style={senior.stepBtnText}>−</Text>
                </TouchableOpacity>

                <View style={senior.stepperValueBox}>
                  <Text style={senior.stepperNumber}>{months}</Text>
                  <Text style={senior.stepperUnit}>เดือน</Text>
                </View>

                <TouchableOpacity
                  style={senior.stepBtn}
                  onPress={() => setMonths(months + 1)}
                >
                  <Text style={senior.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ปุ่มบันทึกข้อมูล */}
        <TouchableOpacity style={senior.saveBigBtn} onPress={save}>
          <Text style={senior.saveBigBtnText}>💾 บันทึกข้อมูลแปลงนา</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// เพิ่มการประกาศ Style Object 'senior'
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