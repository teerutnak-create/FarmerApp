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
import { CROPS, SEED_SOURCES, RICE_TARGET } from '../data/profile';

export default function YieldScreen({ user, onSave, onClose }) {
  const [plot, setPlot] = useState(null);
  const [crop, setCrop] = useState(null);
  const [seed, setSeed] = useState(null);
  const [kg, setKg] = useState(400);

  const save = () => {
    if (!plot) return Alert.alert('ข้อมูลไม่ครบถ้วน', 'กรุณาเลือกแปลงนาก่อนบันทึก');
    if (!crop) return Alert.alert('ข้อมูลไม่ครบถ้วน', 'กรุณาเลือกชนิดพืชที่ปลูก');
    if (!seed) return Alert.alert('ข้อมูลไม่ครบถ้วน', 'กรุณาเลือกแหล่งเมล็ดพันธุ์');

    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const userId = user?.id ? user.id.toUpperCase() : 'USER';
    const lot = 'LOT-' + userId + '-' + date + '-' + (PLOTS.indexOf(plot) + 1);

    onSave('ผลผลิต', {
      plot,
      crop,
      seedSource: seed,
      kgPerRai: kg,
      lot,
      summary: `ผลผลิต ${crop} · ${plot} · ${kg} กก./ไร่ · ${lot}`,
    });

    // หน้าต่างแจ้งเตือนบันทึกสำเร็จ แล้วเด้งกลับหน้าหลักเมื่อกด ตกลง
    Alert.alert(
      'บันทึกสำเร็จ! ✅',
      `เลขล็อตสินค้าของท่านคือ:\n${lot}`,
      [
        {
          text: 'ตกลง',
          onPress: () => {
            if (onClose) onClose();
          },
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>← ย้อนกลับ</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>บันทึกผลผลิตข้าว</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* ข้อ 1: แปลงนา */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>1. เลือกแปลงนา</Text>
          <View style={styles.chipGroup}>
            {PLOTS.map((p) => {
              const isSelected = plot === p;
              return (
                <TouchableOpacity
                  key={p}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => setPlot(p)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ข้อ 2: ชนิดพืช */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>2. ชนิดพืช / พันธุ์ข้าว</Text>
          <View style={styles.chipGroup}>
            {CROPS.map((c) => {
              const isSelected = crop === c;
              return (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => setCrop(c)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ข้อ 3: เมล็ดพันธุ์ */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>3. แหล่งที่มาเมล็ดพันธุ์</Text>
          <View style={styles.chipGroup}>
            {SEED_SOURCES.map((x) => {
              const isSelected = seed === x;
              return (
                <TouchableOpacity
                  key={x}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => setSeed(x)}
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

        {/* ข้อ 4: จำนวนผลผลิต */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>4. ผลผลิตที่ได้ (กิโลกรัมต่อไร่)</Text>
          <View style={styles.stepperContainer}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setKg(Math.max(10, kg - 10))}
              activeOpacity={0.7}
            >
              <Text style={styles.stepBtnText}>− 10</Text>
            </TouchableOpacity>

            <View style={styles.stepperValueBox}>
              <Text style={styles.stepperNumber}>{kg}</Text>
              <Text style={styles.stepperUnit}>กก. / ไร่</Text>
            </View>

            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setKg(kg + 10)}
              activeOpacity={0.7}
            >
              <Text style={styles.stepBtnText}>+ 10</Text>
            </TouchableOpacity>
          </View>

          {crop === 'ข้าวหอมมะลิ' && (
            <View style={styles.hintBadge}>
              <Text style={styles.hintText}>
                💡 เป้าหมายมาตรฐาน: {RICE_TARGET.min}–{RICE_TARGET.max} กก./ไร่
              </Text>
            </View>
          )}
        </View>

        {/* ปุ่มบันทึกใหญ่พิเศษ */}
        <TouchableOpacity 
          style={[styles.saveBigBtn, (!plot || !crop || !seed) && styles.saveBigBtnDisabled]} 
          onPress={save}
          disabled={!plot || !crop || !seed}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBigBtnText}>💾 บันทึกผลผลิตประจำวัน</Text>
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
  topBar: {
    height: 56,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#dcfce7',
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backBtnText: {
    color: '#166534',
    fontWeight: '600',
    fontSize: 16,
  },
  topTitle: {
    color: '#14532d',
    fontWeight: 'bold',
    fontSize: 18,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
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
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  chipActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  chipText: {
    fontSize: 14,
    color: '#15803d',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },

  // Stepper ปุ่มบวกลบ
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  stepBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stepperValueBox: {
    alignItems: 'center',
  },
  stepperNumber: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#14532d',
  },
  stepperUnit: {
    fontSize: 13,
    color: '#16a34a',
    fontWeight: '600',
  },
  hintBadge: {
    marginTop: 12,
    backgroundColor: '#dcfce7',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  hintText: {
    color: '#166534',
    fontSize: 13,
    fontWeight: '500',
  },

  // ปุ่มบันทึกใหญ่
  saveBigBtn: {
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBigBtnDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveBigBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});