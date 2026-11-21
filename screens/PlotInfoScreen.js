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
import VoiceTextInput from './VoiceTextInput';
import ReadAloudLabel from '../components/ReadAloudLabel';
import { notify } from '../utils/notify';
import { hasSelectionOrVoice } from '../utils/hasSelectionOrVoice';
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
  const [voiceNotes, setVoiceNotes] = useState({});
  const [activeVoiceField, setActiveVoiceField] = useState(null);

  const toggle = (list, setList, x) =>
    setList(list.includes(x) ? list.filter((i) => i !== x) : [...list, x]);

  const updateVoiceNote = (fieldKey, text) =>
    setVoiceNotes((notes) => ({ ...notes, [fieldKey]: text }));

  const handleVoiceListeningChange = (fieldKey, isListening) =>
    setActiveVoiceField((active) =>
      isListening ? fieldKey : active === fieldKey ? null : active
    );

  const renderVoiceInput = (fieldKey) => (
    <VoiceTextInput
      value={voiceNotes[fieldKey] || ''}
      onChangeText={(text) => updateVoiceNote(fieldKey, text)}
      fieldKey={fieldKey}
      disabled={activeVoiceField !== null && activeVoiceField !== fieldKey}
      onListeningChange={handleVoiceListeningChange}
    />
  );

  const hasCert = standards.some((x) => CERT_STANDARDS.includes(x));

  const save = () => {
    if (!hasSelectionOrVoice(plot, voiceNotes.plot)) {
      return Alert.alert('ข้อมูลไม่ครบถ้วน', 'กรุณาเลือกแปลงนาหรือบันทึกข้อความเสียง');
    }
    if (!hasSelectionOrVoice(soil, voiceNotes.soil)) {
      return Alert.alert('ข้อมูลไม่ครบถ้วน', 'กรุณาเลือกชนิดดินหรือบันทึกข้อความเสียง');
    }
    if (!hasSelectionOrVoice(chem, voiceNotes.chemical)) {
      return Alert.alert('ข้อมูลไม่ครบถ้วน', 'กรุณาเลือกประวัติการใช้สารเคมีหรือบันทึกข้อความเสียง');
    }
    if (!hasSelectionOrVoice(facilities, voiceNotes.facilities)) {
      return Alert.alert('ข้อมูลไม่ครบถ้วน', 'กรุณาเลือกสิ่งที่มีในแปลงหรือบันทึกข้อความเสียง');
    }
    if (!hasSelectionOrVoice(standards, voiceNotes.standards)) {
      return Alert.alert('ข้อมูลไม่ครบถ้วน', 'กรุณาเลือกมาตรฐานรับรองหรือบันทึกข้อความเสียง');
    }

    const savedPlot = plot || voiceNotes.plot.trim();
    const extra = {
      plot: savedPlot,
      rai,
      soil: soil || voiceNotes.soil.trim(),
      chem: chem || voiceNotes.chemical.trim(),
      facilities,
      standards,
      voiceNotes,
    };
    if (hasCert) {
      extra.certExpiry = new Date(Date.now() + months * 30 * DAY).toISOString();
    }
    extra.summary =
      'ข้อมูลแปลง · ' + savedPlot + ' · ' + rai + ' ไร่' +
      (standards.length > 0 ? ' · ' + standards.join(', ') : '');

    onSave('ข้อมูลแปลง', extra);

    notify('บันทึกสำเร็จ! ✅', extra.summary, onClose);
  };

  const isFormComplete =
    hasSelectionOrVoice(plot, voiceNotes.plot) &&
    hasSelectionOrVoice(soil, voiceNotes.soil) &&
    hasSelectionOrVoice(chem, voiceNotes.chemical) &&
    hasSelectionOrVoice(facilities, voiceNotes.facilities) &&
    hasSelectionOrVoice(standards, voiceNotes.standards);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* แถบส่วนหัว */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>← ย้อนกลับ</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>บันทึกข้อมูลแปลงนา</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* ข้อ 1: เลือกแปลงนา */}
        <View style={styles.card}>
          <ReadAloudLabel
            text="เลือกแปลงนาของท่าน เพื่อระบุแปลงที่ต้องการบันทึกข้อมูล"
            textStyle={[styles.cardTitle, { marginBottom: 0 }]}
            containerStyle={styles.cardTitleRow}
          >
            1. เลือกแปลงนาของท่าน
          </ReadAloudLabel>
          <View style={styles.chipGroup}>
            {PLOTS.map((p) => {
              const isSelected = plot === p;
              return (
                <TouchableOpacity
                  key={p}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => setPlot(isSelected ? null : p)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {renderVoiceInput('plot')}
        </View>

        {/* ข้อ 2: ขนาดแปลงนา */}
        <View style={styles.card}>
          <ReadAloudLabel
            text="ขนาดแปลงนา ระบุพื้นที่ของแปลงเป็นหน่วยไร่"
            textStyle={[styles.cardTitle, { marginBottom: 0 }]}
            containerStyle={styles.cardTitleRow}
          >
            2. ขนาดแปลงนา (ไร่)
          </ReadAloudLabel>
          <View style={styles.stepperContainer}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setRai(Math.max(0.5, rai - 0.5))}
              activeOpacity={0.7}
            >
              <Text style={styles.stepBtnText}>−</Text>
            </TouchableOpacity>

            <View style={styles.stepperValueBox}>
              <Text style={styles.stepperNumber}>{rai}</Text>
              <Text style={styles.stepperUnit}>ไร่</Text>
            </View>

            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setRai(rai + 0.5)}
              activeOpacity={0.7}
            >
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          {renderVoiceInput('area')}
        </View>

        {/* ข้อ 3: ชนิดดิน */}
        <View style={styles.card}>
          <ReadAloudLabel
            text="ชนิดดินในแปลง เลือกประเภทดินที่พบในแปลงนา"
            textStyle={[styles.cardTitle, { marginBottom: 0 }]}
            containerStyle={styles.cardTitleRow}
          >
            3. ชนิดดินในแปลง
          </ReadAloudLabel>
          <View style={styles.chipGroup}>
            {SOILS.map((x) => {
              const isSelected = soil === x;
              return (
                <TouchableOpacity
                  key={x}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => setSoil(isSelected ? null : x)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {x}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {renderVoiceInput('soil')}
        </View>

        {/* ข้อ 4: ประวัติสารเคมี */}
        <View style={styles.card}>
          <ReadAloudLabel
            text="ประวัติการใช้สารเคมี เลือกข้อมูลการใช้สารเคมีในแปลง"
            textStyle={[styles.cardTitle, { marginBottom: 0 }]}
            containerStyle={styles.cardTitleRow}
          >
            4. ประวัติการใช้สารเคมี
          </ReadAloudLabel>
          <View style={styles.chipGroup}>
            {CHEM_HISTORY.map((x) => {
              const isSelected = chem === x;
              return (
                <TouchableOpacity
                  key={x}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => setChem(isSelected ? null : x)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {x}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {renderVoiceInput('chemical')}
        </View>

        {/* ข้อ 5: สิ่งที่มีในแปลง */}
        <View style={styles.card}>
          <ReadAloudLabel
            text="สิ่งที่มีในแปลง เลือกสิ่งอำนวยความสะดวกหรือทรัพยากรที่มีได้หลายข้อ"
            textStyle={[styles.cardTitle, { marginBottom: 0 }]}
            containerStyle={styles.cardTitleRow}
          >
            5. สิ่งที่มีในแปลง (เลือกได้หลายข้อ)
          </ReadAloudLabel>
          <View style={styles.chipGroup}>
            {FACILITIES.map((x) => {
              const isSelected = facilities.includes(x);
              return (
                <TouchableOpacity
                  key={x}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => toggle(facilities, setFacilities, x)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {isSelected ? '✓ ' : ''}{x}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {renderVoiceInput('facilities')}
        </View>

        {/* ข้อ 6: มาตรฐานที่มี */}
        <View style={styles.card}>
          <ReadAloudLabel
            text="มาตรฐานรับรอง เลือกมาตรฐานที่แปลงได้รับหรือกำลังดำเนินการได้หลายข้อ"
            textStyle={[styles.cardTitle, { marginBottom: 0 }]}
            containerStyle={styles.cardTitleRow}
          >
            6. มาตรฐานรับรอง (เลือกได้หลายข้อ)
          </ReadAloudLabel>
          <View style={styles.chipGroup}>
            {STANDARDS.map((x) => {
              const isSelected = standards.includes(x);
              return (
                <TouchableOpacity
                  key={x}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => toggle(standards, setStandards, x)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {isSelected ? '✓ ' : ''}{x}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {renderVoiceInput('standards')}

          {hasCert && (
            <View style={styles.certExpiryBox}>
              <ReadAloudLabel
                text="ใบรับรองหมดอายุในอีกกี่เดือน ระบุระยะเวลาที่เหลือก่อนใบรับรองหมดอายุ"
                textStyle={[styles.cardTitle, { marginBottom: 0 }]}
                containerStyle={styles.cardTitleRow}
              >
                ใบรับรองหมดอายุในอีก (เดือน)
              </ReadAloudLabel>
              <View style={styles.stepperContainer}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setMonths(Math.max(1, months - 1))}
                  activeOpacity={0.7}
                >
                  <Text style={styles.stepBtnText}>−</Text>
                </TouchableOpacity>

                <View style={styles.stepperValueBox}>
                  <Text style={styles.stepperNumber}>{months}</Text>
                  <Text style={styles.stepperUnit}>เดือน</Text>
                </View>

                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setMonths(months + 1)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ปุ่มบันทึกข้อมูล */}
        <TouchableOpacity
          style={[styles.saveBigBtn, !isFormComplete && styles.saveBigBtnDisabled]}
          onPress={save}
          disabled={!isFormComplete}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBigBtnText}>💾 บันทึกข้อมูลแปลงนา</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0fdf4', // สีเขียวอ่อนมินิมอล
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
  cardTitleRow: {
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

  // Stepper
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  stepperValueBox: {
    alignItems: 'center',
  },
  stepperNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#14532d',
  },
  stepperUnit: {
    fontSize: 13,
    color: '#16a34a',
    fontWeight: '600',
  },
  certExpiryBox: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
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