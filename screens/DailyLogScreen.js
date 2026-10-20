import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Voice from '@react-native-voice/voice';
import { s } from '../styles';
import {
  PLOTS,
  ACTIVITIES,
  INPUTS,
  SOURCES,
  WATER,
  WATER_LEVEL,
  PESTS,
  LABOR,
} from '../data/options';

export default function DailyLogScreen({ onSave, onClose }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const [plot, setPlot] = useState(null);
  const [activity, setActivity] = useState(null);
  const [inputKey, setInputKey] = useState(null);
  const [qty, setQty] = useState(1);
  const [source, setSource] = useState(null);
  const [icsNotified, setIcsNotified] = useState(null);
  const [water, setWater] = useState(null);
  const [waterLevel, setWaterLevel] = useState(null);
  const [pest, setPest] = useState('ไม่พบ');
  const [labor, setLabor] = useState([]);

  const [note, setNote] = useState('');
  const [isListeningNote, setIsListeningNote] = useState(false);

  const inputInfo = INPUTS.find((i) => i.key === inputKey);

  useEffect(() => {
    Voice.onSpeechStart = () => setIsListeningNote(true);
    Voice.onSpeechEnd = () => setIsListeningNote(false);
    Voice.onSpeechError = (e) => {
      setIsListeningNote(false);
      console.log('Voice Error: ', e.error);
    };
    Voice.onSpeechResults = (e) => {
      if (e.value && e.value.length > 0) {
        const text = e.value[0];
        setNote((prev) => (prev ? prev + ' ' + text : text));
      }
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const handleVoiceRecordNote = async () => {
    if (isListeningNote) {
      try {
        await Voice.stop();
      } catch (e) {
        console.error(e);
      }
    } else {
      try {
        await Voice.start('th-TH');
      } catch (e) {
        console.error(e);
      }
    }
  };

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const handleConfirmDate = (date) => {
    setSelectedDate(date);
    hideDatePicker();
  };

  const formatDate = (date) => {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear() + 543;
    return `${d}/${m}/${y}`;
  };

  const toggleLabor = (name) => {
    setLabor(
      labor.includes(name) ? labor.filter((x) => x !== name) : [...labor, name]
    );
  };

  const warn = (msg) => Alert.alert('กรอกข้อมูลยังไม่ครบ', msg);

  const save = () => {
    if (!plot) return warn('กรุณาเลือกแปลงนา');
    if (!activity) return warn('กรุณาเลือว่าทำกิจกรรมอะไร');

    if (activity === 'ใส่ปุ๋ย') {
      if (!inputKey) return warn('กรุณาเลือกชนิดปุ๋ย/สารที่ใช้');
      if (!source) return warn('กรุณาเลือกแหล่งที่มา');
      if (inputInfo?.selfMade && icsNotified === null)
        return warn('น้ำหมักทำเอง: กรุณาระบุว่าแจ้ง ICS แล้วหรือยัง');
    }
    if (activity === 'ให้น้ำ' && !water) return warn('กรุณาเลือกแหล่งน้ำ');

    const parts = [activity, plot];
    const extra = { plot, activity, workDate: selectedDate.toISOString(), pest, labor, note };

    if (activity === 'ใส่ปุ๋ย') {
      extra.input = inputKey;
      extra.qty = qty;
      extra.unit = inputInfo.unit;
      extra.source = source;
      parts.push(`${inputKey} ${qty} ${inputInfo.unit}`);
      if (inputInfo.selfMade) {
        extra.icsNotified = icsNotified;
        if (!icsNotified) extra.icsPending = true;
      }
    }
    if (activity === 'ให้น้ำ') {
      extra.water = water;
      extra.waterLevel = waterLevel;
      parts.push(`น้ำจาก${water}`);
    }
    if (pest !== 'ไม่พบ') parts.push(pest);

    extra.summary = parts.join(' · ');
    onSave('บันทึกรายวัน', extra);
    Alert.alert('บันทึกสำเร็จ ✅', extra.summary, [{ text: 'ตกลง', onPress: onClose }]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f3f0ff' }}>
      <StatusBar barStyle="light-content" backgroundColor="#1d1b54" />

      {/* Top Bar */}
      <View style={formStyle.topBar}>
        <TouchableOpacity onPress={onClose} style={formStyle.backBtn}>
          <Text style={formStyle.backBtnText}>← ยกเลิก</Text>
        </TouchableOpacity>
        <Text style={formStyle.topTitle}>📝 บันทึกกิจกรรมรายวัน</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={formStyle.container} showsVerticalScrollIndicator={false}>
        {/* Card 1 */}
        <View style={formStyle.card}>
          <Text style={formStyle.cardTitle}>1. ข้อมูลการลงปฏิบัติงาน</Text>

          <Text style={formStyle.label}>เลือกวันที่ทำกิจกรรม</Text>
          <TouchableOpacity style={formStyle.dateInputBtn} onPress={showDatePicker}>
            <Text style={formStyle.dateInputText}>📅 {formatDate(selectedDate)}</Text>
            <Text style={formStyle.dateInputIcon}>▼</Text>
          </TouchableOpacity>

          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            onConfirm={handleConfirmDate}
            onCancel={hideDatePicker}
            maximumDate={new Date()}
            confirmTextIOS="ตกลง"
            cancelTextIOS="ยกเลิก"
          />

          <Text style={formStyle.label}>เลือกแปลงนา</Text>
          <View style={formStyle.chipGroup}>
            {PLOTS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[formStyle.chip, plot === p && formStyle.chipActive]}
                onPress={() => setPlot(p)}
              >
                <Text style={[formStyle.chipText, plot === p && formStyle.chipTextActive]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Card 2 */}
        <View style={formStyle.card}>
          <Text style={formStyle.cardTitle}>2. กิจกรรมที่ทำ</Text>

          <View style={formStyle.chipGroup}>
            {ACTIVITIES.map((a) => (
              <TouchableOpacity
                key={a.key}
                style={[formStyle.chipLarge, activity === a.key && formStyle.chipActive]}
                onPress={() => setActivity(a.key)}
              >
                <Text style={{ fontSize: 20 }}>{a.icon}</Text>
                <Text
                  style={[
                    formStyle.chipText,
                    activity === a.key && formStyle.chipTextActive,
                    { marginLeft: 6, fontWeight: 'bold' },
                  ]}
                >
                  {a.key}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activity === 'ใส่ปุ๋ย' && (
            <View style={formStyle.subBox}>
              <Text style={formStyle.label}>ชนิดปุ๋ย/สารที่ใช้</Text>
              <View style={formStyle.chipGroup}>
                {INPUTS.map((i) => (
                  <TouchableOpacity
                    key={i.key}
                    style={[formStyle.chip, inputKey === i.key && formStyle.chipActive]}
                    onPress={() => setInputKey(i.key)}
                  >
                    <Text style={[formStyle.chipText, inputKey === i.key && formStyle.chipTextActive]}>
                      {i.key}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {inputInfo && (
                <>
                  <Text style={formStyle.label}>ปริมาณ ({inputInfo.unit})</Text>
                  <View style={formStyle.stepper}>
                    <TouchableOpacity style={formStyle.stepBtn} onPress={() => setQty(Math.max(1, qty - 1))}>
                      <Text style={formStyle.stepText}>−</Text>
                    </TouchableOpacity>
                    <Text style={formStyle.qtyText}>{qty}</Text>
                    <TouchableOpacity style={formStyle.stepBtn} onPress={() => setQty(qty + 1)}>
                      <Text style={formStyle.stepText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={formStyle.label}>แหล่งที่มา</Text>
                  <View style={formStyle.chipGroup}>
                    {SOURCES.map((x) => (
                      <TouchableOpacity
                        key={x}
                        style={[formStyle.chip, source === x && formStyle.chipActive]}
                        onPress={() => setSource(x)}
                      >
                        <Text style={[formStyle.chipText, source === x && formStyle.chipTextActive]}>
                          {x}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {inputInfo?.selfMade && (
                <View style={formStyle.warnCard}>
                  <Text style={formStyle.warnText}>⚠️ น้ำหมักทำเอง ต้องแจ้งขออนุญาต ICS ก่อนใช้</Text>
                  <View style={formStyle.chipGroup}>
                    <TouchableOpacity
                      style={[formStyle.chip, icsNotified === true && formStyle.chipActive]}
                      onPress={() => setIcsNotified(true)}
                    >
                      <Text style={[formStyle.chipText, icsNotified === true && formStyle.chipTextActive]}>
                        ✅ แจ้ง ICS แล้ว
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[formStyle.chip, icsNotified === false && formStyle.chipActive]}
                      onPress={() => setIcsNotified(false)}
                    >
                      <Text style={[formStyle.chipText, icsNotified === false && formStyle.chipTextActive]}>
                        ❌ ยังไม่ได้แจ้ง
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          {activity === 'ให้น้ำ' && (
            <View style={formStyle.subBox}>
              <Text style={formStyle.label}>แหล่งน้ำ</Text>
              <View style={formStyle.chipGroup}>
                {WATER.map((w) => (
                  <TouchableOpacity
                    key={w}
                    style={[formStyle.chip, water === w && formStyle.chipActive]}
                    onPress={() => setWater(w)}
                  >
                    <Text style={[formStyle.chipText, water === w && formStyle.chipTextActive]}>
                      {w}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {water === 'บ่อ' && (
                <>
                  <Text style={formStyle.label}>ระดับน้ำในบ่อ</Text>
                  <View style={formStyle.chipGroup}>
                    {WATER_LEVEL.map((l) => (
                      <TouchableOpacity
                        key={l}
                        style={[formStyle.chip, waterLevel === l && formStyle.chipActive]}
                        onPress={() => setWaterLevel(l)}
                      >
                        <Text style={[formStyle.chipText, waterLevel === l && formStyle.chipTextActive]}>
                          {l}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </View>
          )}
        </View>

        {/* Card 3 */}
        <View style={formStyle.card}>
          <Text style={formStyle.cardTitle}>3. ศัตรูพืชและแรงงาน</Text>

          <Text style={formStyle.label}>การพบแมลง/โรคพืช</Text>
          <View style={formStyle.chipGroup}>
            {PESTS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[formStyle.chip, pest === p && formStyle.chipActive]}
                onPress={() => setPest(p)}
              >
                <Text style={[formStyle.chipText, pest === p && formStyle.chipTextActive]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={formStyle.label}>ใช้แรงงาน/เครื่องจักร (เลือกได้หลายข้อ)</Text>
          <View style={formStyle.chipGroup}>
            {LABOR.map((l) => (
              <TouchableOpacity
                key={l}
                style={[formStyle.chip, labor.includes(l) && formStyle.chipActive]}
                onPress={() => toggleLabor(l)}
              >
                <Text style={[formStyle.chipText, labor.includes(l) && formStyle.chipTextActive]}>
                  {l}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={formStyle.labelRow}>
            <Text style={formStyle.labelVoice}>บันทึกเพิ่มเติม (ถ้ามี)</Text>
            <TouchableOpacity
              style={[formStyle.voiceBtn, isListeningNote && formStyle.voiceBtnActive]}
              onPress={handleVoiceRecordNote}
            >
              <Text style={formStyle.voiceBtnText}>
                {isListeningNote ? '🛑 กดเพื่อหยุดฟัง' : '🎙️ พูดด้วยเสียง'}
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={[s.input, { height: 70, borderRadius: 12, paddingTop: 10 }]}
            value={note}
            onChangeText={setNote}
            placeholder={isListeningNote ? 'กำลังฟัง...' : 'เช่น สภาพอากาศร้อนจัด หรือกดปุ่มพูดด้วยเสียง...'}
            multiline
          />
        </View>

        <TouchableOpacity style={[s.bigBtn, { backgroundColor: '#1d1b54', marginTop: 10 }]} onPress={save}>
          <Text style={s.bigBtnText}>💾 บันทึกกิจกรรมเรียบร้อย</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const formStyle = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, gap: 14 },
  topBar: { height: 54, backgroundColor: '#1d1b54', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  backBtn: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8 },
  backBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },
  topTitle: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1d1b54', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f0ff', paddingBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#4b5563', marginTop: 10, marginBottom: 6 },
  dateInputBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8 },
  dateInputText: { fontSize: 14, color: '#374151', fontWeight: '600' },
  dateInputIcon: { fontSize: 12, color: '#9ca3af' },
  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  chipLarge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  chipActive: { backgroundColor: '#6b52ae', borderColor: '#6b52ae' },
  chipText: { fontSize: 13, color: '#374151' },
  chipTextActive: { color: '#ffffff', fontWeight: 'bold' },
  subBox: { marginTop: 12, padding: 12, backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 },
  stepBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#6b52ae', justifyContent: 'center', alignItems: 'center' },
  stepText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  qtyText: { fontSize: 18, fontWeight: 'bold', color: '#1d1b54' },
  warnCard: { marginTop: 10, padding: 10, backgroundColor: '#fff7ed', borderRadius: 10, borderWidth: 1, borderColor: '#ffedd5' },
  warnText: { color: '#c2410c', fontSize: 12, fontWeight: 'bold', marginBottom: 8 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 6 },
  labelVoice: { fontSize: 13, fontWeight: '600', color: '#4b5563' },
  voiceBtn: { backgroundColor: '#6b52ae', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  voiceBtnActive: { backgroundColor: '#ef4444' },
  voiceBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
});