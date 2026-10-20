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
  Switch,
  Modal,
} from 'react-native';

export default function DailyLogScreen({ onSave, onClose }) {
  // 1. ระบบเลือก วัน / เดือน / ปี (พ.ศ.) แบบเดียวกับหน้า Sign Up
  const today = new Date();
  const [day, setDay] = useState(today.getDate().toString());
  const [month, setMonth] = useState((today.getMonth() + 1).toString());
  const [year, setYear] = useState((today.getFullYear() + 543).toString()); // พ.ศ.

  // State สำหรับควบคุม Modal ตัวเลือก วัน/เดือน/ปี บน Mobile
  const [activePickerModal, setActivePickerModal] = useState(null); // 'day', 'month', 'year', or null

  // รายชื่อเดือนภาษาไทย
  const monthsList = [
    { id: '1', name: 'มกราคม' },
    { id: '2', name: 'กุมภาพันธ์' },
    { id: '3', name: 'มีนาคม' },
    { id: '4', name: 'เมษายน' },
    { id: '5', name: 'พฤษภาคม' },
    { id: '6', name: 'มิถุนายน' },
    { id: '7', name: 'กรกฎาคม' },
    { id: '8', name: 'สิงหาคม' },
    { id: '9', name: 'กันยายน' },
    { id: '10', name: 'ตุลาคม' },
    { id: '11', name: 'พฤศจิกายน' },
    { id: '12', name: 'ธันวาคม' },
  ];

  const daysList = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const yearsList = [
    (today.getFullYear() + 543).toString(),
    (today.getFullYear() + 543 - 1).toString(),
    (today.getFullYear() + 543 - 2).toString(),
  ];

  // 2. กิจกรรมในแปลง
  const [selectedPlot, setSelectedPlot] = useState('แปลงหลัก');
  const [selectedActivity, setSelectedActivity] = useState('ให้น้ำ');
  const [activityNote, setActivityNote] = useState('');

  // 3. ปัจจัยการผลิตที่ใช้
  const [inputType, setInputType] = useState('ปุ๋ยหมัก');
  const [inputQuantity, setInputQuantity] = useState('1 ถุง/กระสอบ');
  const [inputNote, setInputNote] = useState('');

  // 4. น้ำหมัก/สารทำเอง & ขออนุมัติ
  const [selfMadeFormula, setSelfMadeFormula] = useState('น้ำหมักชีวภาพ');
  const [requestIcsApproval, setRequestIcsApproval] = useState(true);
  const [selfMadeNote, setSelfMadeNote] = useState('');

  // 5. การจัดการน้ำ
  const [waterSource, setWaterSource] = useState('บ่อน้ำประจำแปลง');
  const [waterLevel, setWaterLevel] = useState('ปกติ');
  const [waterNote, setWaterNote] = useState('');

  // 6. แรงงาน
  const [workerType, setWorkerType] = useState('ทำเองในครัวเรือน');
  const [workerNote, setWorkerNote] = useState('');

  // แสดงการแจ้งเตือนรองรับ Web/Mobile
  const showAlert = (title, message, callback) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
      if (callback) callback();
    } else {
      Alert.alert(title, message, [{ text: 'ตกลง', onPress: callback }]);
    }
  };

  // ฟังก์ชันจับเสียงพูดเปลี่ยนเป็นข้อความ
  const handleSpeechToText = (currentText, setTextFunc, sectionName) => {
    showAlert(
      '🎙️ ฟังเสียงพูดระบบอัตโนมัติ',
      `ระบบกำลังรับเสียงสำหรับหมวด "${sectionName}"...\n(พูดรายละเอียดข้อความที่ต้องการเติมได้เลย)`,
      () => {
        const simulatedText = ` [บันทึกจากเสียง: ${sectionName} เพิ่มเติม]`;
        setTextFunc((prev) => (prev ? prev + simulatedText : `${sectionName} เพิ่มเติม`));
      }
    );
  };

  const handleSave = () => {
    const formattedDate = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    const logData = {
      date: formattedDate,
      plot: selectedPlot,
      activity: selectedActivity,
      activityNote,
      input: {
        type: inputType,
        quantity: inputQuantity,
        note: inputNote,
      },
      selfMade: {
        formula: selfMadeFormula,
        icsRequested: requestIcsApproval,
        note: selfMadeNote,
      },
      water: {
        source: waterSource,
        level: waterLevel,
        note: waterNote,
      },
      worker: workerType,
      workerNote,
      timestamp: new Date().toISOString(),
    };

    if (onSave) {
      onSave('บันทึกกิจกรรมประจำวัน', logData);
    }

    showAlert('บันทึกสำเร็จ ✅', `บันทึกข้อมูลวันที่ ${formattedDate} เรียบร้อยแล้ว`, () => {
      if (onClose) onClose();
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* หัวข้อด้านบน */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Text style={styles.backText}>◀ ย้อนกลับ</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>📝 บันทึกกิจกรรมแปลง</Text>
        </View>

        {/* 1. เลือก วัน / เดือน / ปี (พ.ศ.) */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📅 1. เลือกวันที่ และ กิจกรรมในแปลง</Text>
          
          <Text style={styles.label}>วันที่บันทึกกิจกรรม (วัน / เดือน / ปี พ.ศ.):</Text>
          <View style={styles.dateSelectorRow}>
            
            {/* เลือกวัน */}
            <View style={styles.selectBoxContainer}>
              <Text style={styles.selectBoxLabel}>วัน</Text>
              {Platform.OS === 'web' ? (
                <select
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  style={webSelectStyle}
                >
                  {daysList.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              ) : (
                <TouchableOpacity
                  style={styles.mobileSelectBtn}
                  onPress={() => setActivePickerModal('day')}
                >
                  <Text style={styles.mobileSelectText}>{day}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* เลือกเดือน */}
            <View style={[styles.selectBoxContainer, { flex: 2 }]}>
              <Text style={styles.selectBoxLabel}>เดือน</Text>
              {Platform.OS === 'web' ? (
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  style={webSelectStyle}
                >
                  {monthsList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              ) : (
                <TouchableOpacity
                  style={styles.mobileSelectBtn}
                  onPress={() => setActivePickerModal('month')}
                >
                  <Text style={styles.mobileSelectText}>
                    {monthsList.find((item) => item.id === month)?.name || month}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* เลือกปี พ.ศ. */}
            <View style={styles.selectBoxContainer}>
              <Text style={styles.selectBoxLabel}>ปี พ.ศ.</Text>
              {Platform.OS === 'web' ? (
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  style={webSelectStyle}
                >
                  {yearsList.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              ) : (
                <TouchableOpacity
                  style={styles.mobileSelectBtn}
                  onPress={() => setActivePickerModal('year')}
                >
                  <Text style={styles.mobileSelectText}>{year}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Text style={styles.label}>เลือกแปลงของคุณ:</Text>
          <View style={styles.chipGroup}>
            {['แปลงหลัก', 'แปลงที่ 2', 'แปลงผักไหม'].map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.bigChip, selectedPlot === p && styles.bigChipActive]}
                onPress={() => setSelectedPlot(p)}
              >
                <Text style={[styles.bigChipText, selectedPlot === p && styles.bigChipTextActive]}>
                  {selectedPlot === p ? `✓ ${p}` : p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>วันนี้ทำอะไรในแปลง:</Text>
          <View style={styles.chipGroup}>
            {['เตรียมดิน', 'ปลูก', 'ใส่ปุ๋ย', 'กำจัดวัชพืช', 'ให้น้ำ', 'เก็บเกี่ยว'].map((act) => (
              <TouchableOpacity
                key={act}
                style={[styles.bigChip, selectedActivity === act && styles.bigChipActive]}
                onPress={() => setSelectedActivity(act)}
              >
                <Text style={[styles.bigChipText, selectedActivity === act && styles.bigChipTextActive]}>
                  {selectedActivity === act ? `✓ ${act}` : act}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* กล่องข้อความ + ปุ่มอัดเสียงจับข้อความ */}
          <Text style={styles.subLabel}>รายละเอียดกิจกรรมเพิ่มเติม:</Text>
          <View style={styles.speechInputContainer}>
            <TextInput
              style={styles.speechInput}
              placeholder="พิมพ์เพิ่มเติม หรือกดไมค์เพื่อพูด..."
              value={activityNote}
              onChangeText={setActivityNote}
              multiline
            />
            <TouchableOpacity
              style={styles.micBtn}
              onPress={() => handleSpeechToText(activityNote, setActivityNote, 'กิจกรรม')}
            >
              <Text style={styles.micBtnText}>🎙️ พูดเพื่อพิมพ์</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. ปัจจัยการผลิตที่ใช้ */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📦 2. ปุ๋ยและปัจจัยที่ใช้</Text>

          <Text style={styles.label}>ชนิดที่ใช้:</Text>
          <View style={styles.chipGroup}>
            {['ปุ๋ยหมัก', 'แหนแดง', 'น้ำหมักชีวภาพ', 'ปุ๋ยคอก', 'เมล็ดพันธุ์'].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.bigChip, inputType === t && styles.bigChipActive]}
                onPress={() => setInputType(t)}
              >
                <Text style={[styles.bigChipText, inputType === t && styles.bigChipTextActive]}>
                  {inputType === t ? `✓ ${t}` : t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>ปริมาณที่ใช้:</Text>
          <View style={styles.chipGroup}>
            {['1 ถุง/กระสอบ', '2-3 กระสอบ', '5 กระสอบขึ้นไป', '10-20 ลิตร'].map((q) => (
              <TouchableOpacity
                key={q}
                style={[styles.bigChip, inputQuantity === q && styles.bigChipActive]}
                onPress={() => setInputQuantity(q)}
              >
                <Text style={[styles.bigChipText, inputQuantity === q && styles.bigChipTextActive]}>
                  {inputQuantity === q ? `✓ ${q}` : q}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.subLabel}>รายละเอียดปุ๋ย/ปัจจัยเพิ่มเติม:</Text>
          <View style={styles.speechInputContainer}>
            <TextInput
              style={styles.speechInput}
              placeholder="พิมพ์เพิ่มเติม หรือกดไมค์เพื่อพูด..."
              value={inputNote}
              onChangeText={setInputNote}
              multiline
            />
            <TouchableOpacity
              style={styles.micBtn}
              onPress={() => handleSpeechToText(inputNote, setInputNote, 'ปัจจัยการผลิต')}
            >
              <Text style={styles.micBtnText}>🎙️ พูดเพื่อพิมพ์</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. น้ำหมัก/สารทำเอง & สิทธิ์การขออนุญาต */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🧪 3. น้ำหมัก / สารทำเอง</Text>
          <Text style={styles.label}>สูตรน้ำหมักที่ใช้:</Text>
          <View style={styles.chipGroup}>
            {['น้ำหมักชีวภาพ', 'น้ำหมักมูลสุกร', 'น้ำหมักเปลือกสับปะรด', 'ฮอร์โมนไข่'].map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.bigChip, selfMadeFormula === f && styles.bigChipActive]}
                onPress={() => setSelfMadeFormula(f)}
              >
                <Text style={[styles.bigChipText, selfMadeFormula === f && styles.bigChipTextActive]}>
                  {selfMadeFormula === f ? `✓ ${f}` : f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>แจ้งขออนุญาตระบบ ICS</Text>
            <Switch
              value={requestIcsApproval}
              onValueChange={setRequestIcsApproval}
              trackColor={{ true: '#16a34a' }}
            />
          </View>

          <Text style={styles.subLabel}>รายละเอียดสูตรน้ำหมักเพิ่มเติม:</Text>
          <View style={styles.speechInputContainer}>
            <TextInput
              style={styles.speechInput}
              placeholder="พิมพ์เพิ่มเติม หรือกดไมค์เพื่อพูด..."
              value={selfMadeNote}
              onChangeText={setSelfMadeNote}
              multiline
            />
            <TouchableOpacity
              style={styles.micBtn}
              onPress={() => handleSpeechToText(selfMadeNote, setSelfMadeNote, 'น้ำหมักสารทำเอง')}
            >
              <Text style={styles.micBtnText}>🎙️ พูดเพื่อพิมพ์</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. แหล่งน้ำ */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>💧 4. การจัดการน้ำ</Text>

          <Text style={styles.label}>แหล่งน้ำที่ใช้:</Text>
          <View style={styles.chipGroup}>
            {['บ่อน้ำประจำแปลง', 'ธนาคารน้ำใต้ดิน', 'ระบบโซลาร์เซลล์', 'น้ำชลประทาน'].map((w) => (
              <TouchableOpacity
                key={w}
                style={[styles.bigChip, waterSource === w && styles.bigChipActive]}
                onPress={() => setWaterSource(w)}
              >
                <Text style={[styles.bigChipText, waterSource === w && styles.bigChipTextActive]}>
                  {waterSource === w ? `✓ ${w}` : w}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>ระดับน้ำในบ่อ:</Text>
          <View style={styles.chipGroup}>
            {['ปกติ', 'น้ำลดลง', 'แห้งขอด'].map((l) => (
              <TouchableOpacity
                key={l}
                style={[styles.bigChip, waterLevel === l && styles.bigChipActive]}
                onPress={() => setWaterLevel(l)}
              >
                <Text style={[styles.bigChipText, waterLevel === l && styles.bigChipTextActive]}>
                  {waterLevel === l ? `✓ ${l}` : l}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.subLabel}>รายละเอียดเรื่องน้ำเพิ่มเติม:</Text>
          <View style={styles.speechInputContainer}>
            <TextInput
              style={styles.speechInput}
              placeholder="พิมพ์เพิ่มเติม หรือกดไมค์เพื่อพูด..."
              value={waterNote}
              onChangeText={setWaterNote}
              multiline
            />
            <TouchableOpacity
              style={styles.micBtn}
              onPress={() => handleSpeechToText(waterNote, setWaterNote, 'การจัดการน้ำ')}
            >
              <Text style={styles.micBtnText}>🎙️ พูดเพื่อพิมพ์</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 5. แรงงาน */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>👨‍🌾 5. ผู้ปฏิบัติงาน & เครื่องจักร</Text>
          <View style={styles.chipGroup}>
            {['ทำเองในครัวเรือน', 'จ้างแรงงาน', 'กลุ่มวานแรง'].map((wrk) => (
              <TouchableOpacity
                key={wrk}
                style={[styles.bigChip, workerType === wrk && styles.bigChipActive]}
                onPress={() => setWorkerType(wrk)}
              >
                <Text style={[styles.bigChipText, workerType === wrk && styles.bigChipTextActive]}>
                  {workerType === wrk ? `✓ ${wrk}` : wrk}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.subLabel}>รายละเอียดผู้ปฏิบัติงานเพิ่มเติม:</Text>
          <View style={styles.speechInputContainer}>
            <TextInput
              style={styles.speechInput}
              placeholder="พิมพ์เพิ่มเติม หรือกดไมค์เพื่อพูด..."
              value={workerNote}
              onChangeText={setWorkerNote}
              multiline
            />
            <TouchableOpacity
              style={styles.micBtn}
              onPress={() => handleSpeechToText(workerNote, setWorkerNote, 'แรงงานเครื่องจักร')}
            >
              <Text style={styles.micBtnText}>🎙️ พูดเพื่อพิมพ์</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ปุ่มบันทึกใหญ่ชัดเจน */}
        <TouchableOpacity style={styles.saveBtnLarge} onPress={handleSave}>
          <Text style={styles.saveBtnTextLarge}>💾 กดเพื่อบันทึกข้อมูล</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ================= MODAL สำหรับเลือก วัน/เดือน/ปี บน Mobile ================= */}
      <Modal visible={activePickerModal !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {activePickerModal === 'day' && 'เลือกวัน'}
              {activePickerModal === 'month' && 'เลือกเดือน'}
              {activePickerModal === 'year' && 'เลือกปี พ.ศ.'}
            </Text>

            <ScrollView style={{ maxHeight: 250, marginVertical: 10 }}>
              {activePickerModal === 'day' &&
                daysList.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.pickerItem, day === d && styles.pickerItemActive]}
                    onPress={() => {
                      setDay(d);
                      setActivePickerModal(null);
                    }}
                  >
                    <Text style={[styles.pickerItemText, day === d && styles.pickerItemTextActive]}>
                      วันที่ {d}
                    </Text>
                  </TouchableOpacity>
                ))}

              {activePickerModal === 'month' &&
                monthsList.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.pickerItem, month === m.id && styles.pickerItemActive]}
                    onPress={() => {
                      setMonth(m.id);
                      setActivePickerModal(null);
                    }}
                  >
                    <Text style={[styles.pickerItemText, month === m.id && styles.pickerItemTextActive]}>
                      {m.name}
                    </Text>
                  </TouchableOpacity>
                ))}

              {activePickerModal === 'year' &&
                yearsList.map((y) => (
                  <TouchableOpacity
                    key={y}
                    style={[styles.pickerItem, year === y && styles.pickerItemActive]}
                    onPress={() => {
                      setYear(y);
                      setActivePickerModal(null);
                    }}
                  >
                    <Text style={[styles.pickerItemText, year === y && styles.pickerItemTextActive]}>
                      พ.ศ. {y}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setActivePickerModal(null)}
            >
              <Text style={styles.modalCloseText}>ปิด</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const webSelectStyle = {
  width: '100%',
  padding: '10px',
  borderRadius: '8px',
  border: '2px solid #2e7d32',
  fontSize: '15px',
  fontWeight: 'bold',
  backgroundColor: '#ffffff',
  color: '#1b5e20',
  boxSizing: 'border-box',
  outline: 'none',
  cursor: 'pointer',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f8e9' },
  content: { padding: 14, gap: 14, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  backBtn: { backgroundColor: '#e8f5e9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginRight: 10 },
  backText: { color: '#2e7d32', fontWeight: 'bold', fontSize: 14 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1b5e20' },

  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1b5e20', marginBottom: 10 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginTop: 10, marginBottom: 6 },
  subLabel: { fontSize: 12, fontWeight: 'bold', color: '#1b5e20', marginTop: 12, marginBottom: 4 },

  dateSelectorRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  selectBoxContainer: { flex: 1 },
  selectBoxLabel: { fontSize: 10, fontWeight: 'bold', color: '#6b7280', marginBottom: 2 },
  mobileSelectBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#2e7d32',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  mobileSelectText: { fontSize: 14, fontWeight: 'bold', color: '#1b5e20' },

  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  bigChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    borderWidth: 1.5,
    borderColor: '#d1d5db',
  },
  bigChipActive: { backgroundColor: '#dcfce7', borderColor: '#16a34a' },
  bigChipText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  bigChipTextActive: { color: '#15803d', fontWeight: 'bold' },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  switchLabel: { fontSize: 14, fontWeight: 'bold', color: '#1b5e20' },

  speechInputContainer: {
    gap: 6,
    backgroundColor: '#fafafa',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  speechInput: {
    fontSize: 13,
    color: '#1f2937',
    minHeight: 40,
    textAlignVertical: 'top',
  },
  micBtn: {
    backgroundColor: '#15803d',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  micBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  saveBtnLarge: {
    backgroundColor: '#16a34a',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnTextLarge: { color: '#ffffff', fontWeight: 'bold', fontSize: 18 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '85%', backgroundColor: '#ffffff', borderRadius: 16, padding: 16 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#1b5e20', textAlign: 'center' },
  pickerItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'center' },
  pickerItemActive: { backgroundColor: '#dcfce7', borderRadius: 8 },
  pickerItemText: { fontSize: 14, color: '#334155' },
  pickerItemTextActive: { color: '#15803d', fontWeight: 'bold' },
  modalCloseBtn: { marginTop: 10, backgroundColor: '#94a3b8', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  modalCloseText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },
});