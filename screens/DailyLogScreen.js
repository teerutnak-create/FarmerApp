import React, { useState, useEffect } from 'react';
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

export default function DailyLogScreen({ onSave, onClose, isOfficer = false, targetFarmer = null, initialData = null }) {
  // 🟢 ธีมสีสลับตาม Role
  const themeBg = isOfficer ? '#f0f9ff' : '#f1f8e9';
  const themePrimary = isOfficer ? '#0284c7' : '#1b5e20';
  const themeSecondary = isOfficer ? '#0ea5e9' : '#16a34a';
  const themeLight = isOfficer ? '#e0f2fe' : '#e8f5e9';
  const themeBorder = isOfficer ? '#bae6fd' : '#c8e6c9';
  const themeActiveBg = isOfficer ? '#e0f2fe' : '#dcfce7';
  const themeActiveBorder = isOfficer ? '#0284c7' : '#16a34a';

  // 1. ระบบเลือก วัน / เดือน / ปี (พ.ศ.) 
  const today = new Date();
  const [day, setDay] = useState(today.getDate().toString());
  const [month, setMonth] = useState((today.getMonth() + 1).toString());
  const [year, setYear] = useState((today.getFullYear() + 543).toString());

  const [activePickerModal, setActivePickerModal] = useState(null); 

  const monthsList = [
    { id: '1', name: 'มกราคม' }, { id: '2', name: 'กุมภาพันธ์' }, { id: '3', name: 'มีนาคม' },
    { id: '4', name: 'เมษายน' }, { id: '5', name: 'พฤษภาคม' }, { id: '6', name: 'มิถุนายน' },
    { id: '7', name: 'กรกฎาคม' }, { id: '8', name: 'สิงหาคม' }, { id: '9', name: 'กันยายน' },
    { id: '10', name: 'ตุลาคม' }, { id: '11', name: 'พฤศจิกายน' }, { id: '12', name: 'ธันวาคม' },
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

  // 7. ความชื้น
  const [moistureValue, setMoistureValue] = useState('');

  useEffect(() => {
    if (initialData) {
      if (initialData.date) {
        const parts = initialData.date.split('/');
        if (parts.length === 3) {
          setDay(parseInt(parts[0], 10).toString());
          setMonth(parseInt(parts[1], 10).toString());
          setYear(parts[2]);
        }
      }
      if (initialData.plot) setSelectedPlot(initialData.plot);
      if (initialData.activity) setSelectedActivity(initialData.activity);
      if (initialData.activityNote) setActivityNote(initialData.activityNote);

      if (initialData.input) {
        if (initialData.input.type) setInputType(initialData.input.type);
        if (initialData.input.quantity) setInputQuantity(initialData.input.quantity);
        if (initialData.input.note) setInputNote(initialData.input.note);
      }

      if (initialData.selfMade) {
        if (initialData.selfMade.formula) setSelfMadeFormula(initialData.selfMade.formula);
        if (initialData.selfMade.icsRequested !== undefined) setRequestIcsApproval(initialData.selfMade.icsRequested);
        if (initialData.selfMade.note) setSelfMadeNote(initialData.selfMade.note);
      }

      if (initialData.water) {
        if (initialData.water.source) setWaterSource(initialData.water.source);
        if (initialData.water.level) setWaterLevel(initialData.water.level);
        if (initialData.water.note) setWaterNote(initialData.water.note);
      }

      if (initialData.worker) setWorkerType(initialData.worker);
      if (initialData.workerNote) setWorkerNote(initialData.workerNote);
      if (initialData.moisture !== undefined) setMoistureValue(initialData.moisture.toString());
    }
  }, [initialData]);

  const showAlert = (title, message, callback) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
      if (callback) callback();
    } else {
      Alert.alert(title, message, [{ text: 'ตกลง', onPress: callback }]);
    }
  };

  // 🎙️ สถานะการฟังเสียง (เก็บชื่อหมวดที่กำลังฟังอยู่)
  const [listeningSection, setListeningSection] = useState(null);
  const recognitionRef = React.useRef(null);

  const handleSpeechToText = (currentText, setTextFunc, sectionName) => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      showAlert('แจ้งเตือน', 'ฟีเจอร์พูดเพื่อพิมพ์ใช้ได้บนเว็บเท่านั้นในตอนนี้');
      return;
    }

    // กดซ้ำขณะกำลังฟัง = หยุดฟัง
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      showAlert('ไม่รองรับ', 'เบราว์เซอร์นี้ไม่รองรับการพูดเพื่อพิมพ์ แนะนำให้ใช้ Google Chrome');
      return;
    }

    const rec = new SR();
    rec.lang = 'th-TH';
    rec.interimResults = false;
    rec.continuous = false;

    rec.onstart = () => setListeningSection(sectionName);
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setTextFunc((prev) => (prev ? `${prev} ${text}` : text));
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        showAlert('ไม่ได้รับอนุญาตใช้ไมโครโฟน', 'กรุณาอนุญาตการใช้ไมค์ในเบราว์เซอร์แล้วลองใหม่');
      }
    };
    rec.onend = () => {
      recognitionRef.current = null;
      setListeningSection(null);
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch (err) {
      recognitionRef.current = null;
      setListeningSection(null);
    }
  };

  // 🟢 ฟังก์ชันบันทึกข้อมูล พร้อมแสดงป๊อปอัปแจ้งเตือนและเด้งกลับหน้าหลักทันทีเมื่อกด OK
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
      moisture: moistureValue ? parseFloat(moistureValue) : undefined,
      category: 'ACTIVITY',
      timestamp: new Date().toISOString(),
    };

    // 1. เซฟข้อมูลลงระบบ
    if (onSave) {
      onSave(initialData ? initialData.type : 'บันทึกกิจกรรมประจำวัน', logData);
    }

    // 2. 🟢 แสดง Pop-up แจ้งเตือน + พอกด OK แล้วจะเรียก onClose() เด้งกลับหน้าหลักทันที!
    showAlert('บันทึกสำเร็จ ✅', `บันทึกข้อมูลวันที่ ${formattedDate} เรียบร้อยแล้ว`, () => {
      if (onClose) onClose();
    });
  };

  const webSelectStyle = {
    width: '100%', padding: '10px', borderRadius: '8px', border: `2px solid ${themePrimary}`,
    fontSize: '15px', fontWeight: 'bold', backgroundColor: '#ffffff', color: themePrimary,
    boxSizing: 'border-box', outline: 'none', cursor: 'pointer',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeBg }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* หัวข้อด้านบน */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={[styles.backBtn, { backgroundColor: themeLight }]}>
            <Text style={[styles.backText, { color: themePrimary }]}>◀ ย้อนกลับ</Text>
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: themePrimary }]}>
              {initialData ? '✏️ แก้ไขบันทึกกิจกรรม' : isOfficer ? '📝 ฟอร์มเจ้าหน้าที่ (บันทึกแทน)' : '📝 บันทึกกิจกรรมแปลง'}
            </Text>
            {isOfficer && targetFarmer && (
              <Text style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                กำลังบันทึกข้อมูลให้: คุณ{targetFarmer.name}
              </Text>
            )}
          </View>
        </View>

        {/* 1. เลือก วัน / เดือน / ปี (พ.ศ.) */}
        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { color: themePrimary }]}>📅 1. เลือกวันที่ และ กิจกรรมในแปลง</Text>
          
          <Text style={styles.label}>วันที่บันทึกกิจกรรม (วัน / เดือน / ปี พ.ศ.):</Text>
          <View style={styles.dateSelectorRow}>
            <View style={styles.selectBoxContainer}>
              <Text style={styles.selectBoxLabel}>วัน</Text>
              {Platform.OS === 'web' ? (
                <select value={day} onChange={(e) => setDay(e.target.value)} style={webSelectStyle}>
                  {daysList.map((d) => (<option key={d} value={d}>{d}</option>))}
                </select>
              ) : (
                <TouchableOpacity style={[styles.mobileSelectBtn, { borderColor: themePrimary }]} onPress={() => setActivePickerModal('day')}>
                  <Text style={[styles.mobileSelectText, { color: themePrimary }]}>{day}</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.selectBoxContainer, { flex: 2 }]}>
              <Text style={styles.selectBoxLabel}>เดือน</Text>
              {Platform.OS === 'web' ? (
                <select value={month} onChange={(e) => setMonth(e.target.value)} style={webSelectStyle}>
                  {monthsList.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
                </select>
              ) : (
                <TouchableOpacity style={[styles.mobileSelectBtn, { borderColor: themePrimary }]} onPress={() => setActivePickerModal('month')}>
                  <Text style={[styles.mobileSelectText, { color: themePrimary }]}>
                    {monthsList.find((item) => item.id === month)?.name || month}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.selectBoxContainer}>
              <Text style={styles.selectBoxLabel}>ปี พ.ศ.</Text>
              {Platform.OS === 'web' ? (
                <select value={year} onChange={(e) => setYear(e.target.value)} style={webSelectStyle}>
                  {yearsList.map((y) => (<option key={y} value={y}>{y}</option>))}
                </select>
              ) : (
                <TouchableOpacity style={[styles.mobileSelectBtn, { borderColor: themePrimary }]} onPress={() => setActivePickerModal('year')}>
                  <Text style={[styles.mobileSelectText, { color: themePrimary }]}>{year}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Text style={styles.label}>เลือกแปลงของคุณ:</Text>
          <View style={styles.chipGroup}>
            {['แปลงหลัก', 'แปลงที่ 2', 'แปลงผักไหม'].map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.bigChip, selectedPlot === p && { backgroundColor: themeActiveBg, borderColor: themeActiveBorder }]}
                onPress={() => setSelectedPlot(p)}
              >
                <Text style={[styles.bigChipText, selectedPlot === p && { color: themeActiveBorder, fontWeight: 'bold' }]}>
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
                style={[styles.bigChip, selectedActivity === act && { backgroundColor: themeActiveBg, borderColor: themeActiveBorder }]}
                onPress={() => setSelectedActivity(act)}
              >
                <Text style={[styles.bigChipText, selectedActivity === act && { color: themeActiveBorder, fontWeight: 'bold' }]}>
                  {selectedActivity === act ? `✓ ${act}` : act}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.subLabel, { color: themePrimary }]}>รายละเอียดกิจกรรมเพิ่มเติม:</Text>
          <View style={[styles.speechInputContainer, { borderColor: themeBorder }]}>
            <TextInput
              style={styles.speechInput}
              placeholder="พิมพ์เพิ่มเติม หรือกดไมค์เพื่อพูด..."
              value={activityNote}
              onChangeText={setActivityNote}
              multiline
            />
            <TouchableOpacity style={[styles.micBtn, { backgroundColor: themePrimary }]} onPress={() => handleSpeechToText(activityNote, setActivityNote, 'กิจกรรม')}>
              <Text style={styles.micBtnText}>{listeningSection === 'กิจกรรม' ? '🔴 กำลังฟัง... (กดเพื่อหยุด)' : '🎙️ พูดเพื่อพิมพ์'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. ปัจจัยการผลิตที่ใช้ */}
        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { color: themePrimary }]}>📦 2. ปุ๋ยและปัจจัยที่ใช้</Text>

          <Text style={styles.label}>ชนิดที่ใช้:</Text>
          <View style={styles.chipGroup}>
            {['ปุ๋ยหมัก', 'แหนแดง', 'น้ำหมักชีวภาพ', 'ปุ๋ยคอก', 'เมล็ดพันธุ์'].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.bigChip, inputType === t && { backgroundColor: themeActiveBg, borderColor: themeActiveBorder }]}
                onPress={() => setInputType(t)}
              >
                <Text style={[styles.bigChipText, inputType === t && { color: themeActiveBorder, fontWeight: 'bold' }]}>
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
                style={[styles.bigChip, inputQuantity === q && { backgroundColor: themeActiveBg, borderColor: themeActiveBorder }]}
                onPress={() => setInputQuantity(q)}
              >
                <Text style={[styles.bigChipText, inputQuantity === q && { color: themeActiveBorder, fontWeight: 'bold' }]}>
                  {inputQuantity === q ? `✓ ${q}` : q}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.subLabel, { color: themePrimary }]}>รายละเอียดปุ๋ย/ปัจจัยเพิ่มเติม:</Text>
          <View style={[styles.speechInputContainer, { borderColor: themeBorder }]}>
            <TextInput
              style={styles.speechInput}
              placeholder="พิมพ์เพิ่มเติม หรือกดไมค์เพื่อพูด..."
              value={inputNote}
              onChangeText={setInputNote}
              multiline
            />
            <TouchableOpacity style={[styles.micBtn, { backgroundColor: themePrimary }]} onPress={() => handleSpeechToText(inputNote, setInputNote, 'ปัจจัยการผลิต')}>
              <Text style={styles.micBtnText}>{listeningSection === 'ปัจจัยการผลิต' ? '🔴 กำลังฟัง... (กดเพื่อหยุด)' : '🎙️ พูดเพื่อพิมพ์'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. น้ำหมัก/สารทำเอง & สิทธิ์การขออนุญาต */}
        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { color: themePrimary }]}>🧪 3. น้ำหมัก / สารทำเอง</Text>
          <Text style={styles.label}>สูตรน้ำหมักที่ใช้:</Text>
          <View style={styles.chipGroup}>
            {['น้ำหมักชีวภาพ', 'น้ำหมักมูลสุกร', 'น้ำหมักเปลือกสับปะรด', 'ฮอร์โมนไข่'].map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.bigChip, selfMadeFormula === f && { backgroundColor: themeActiveBg, borderColor: themeActiveBorder }]}
                onPress={() => setSelfMadeFormula(f)}
              >
                <Text style={[styles.bigChipText, selfMadeFormula === f && { color: themeActiveBorder, fontWeight: 'bold' }]}>
                  {selfMadeFormula === f ? `✓ ${f}` : f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: themePrimary }]}>แจ้งขออนุญาตระบบ ICS</Text>
            <Switch
              value={requestIcsApproval}
              onValueChange={setRequestIcsApproval}
              trackColor={{ true: themeSecondary }}
            />
          </View>

          <Text style={[styles.subLabel, { color: themePrimary }]}>รายละเอียดสูตรน้ำหมักเพิ่มเติม:</Text>
          <View style={[styles.speechInputContainer, { borderColor: themeBorder }]}>
            <TextInput
              style={styles.speechInput}
              placeholder="พิมพ์เพิ่มเติม หรือกดไมค์เพื่อพูด..."
              value={selfMadeNote}
              onChangeText={setSelfMadeNote}
              multiline
            />
            <TouchableOpacity style={[styles.micBtn, { backgroundColor: themePrimary }]} onPress={() => handleSpeechToText(selfMadeNote, setSelfMadeNote, 'น้ำหมักสารทำเอง')}>
              <Text style={styles.micBtnText}>{listeningSection === 'น้ำหมักสารทำเอง' ? '🔴 กำลังฟัง... (กดเพื่อหยุด)' : '🎙️ พูดเพื่อพิมพ์'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. แหล่งน้ำ */}
        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { color: themePrimary }]}>💧 4. การจัดการน้ำ</Text>

          <Text style={styles.label}>แหล่งน้ำที่ใช้:</Text>
          <View style={styles.chipGroup}>
            {['บ่อน้ำประจำแปลง', 'ธนาคารน้ำใต้ดิน', 'ระบบโซลาร์เซลล์', 'น้ำชลประทาน'].map((w) => (
              <TouchableOpacity
                key={w}
                style={[styles.bigChip, waterSource === w && { backgroundColor: themeActiveBg, borderColor: themeActiveBorder }]}
                onPress={() => setWaterSource(w)}
              >
                <Text style={[styles.bigChipText, waterSource === w && { color: themeActiveBorder, fontWeight: 'bold' }]}>
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
                style={[styles.bigChip, waterLevel === l && { backgroundColor: themeActiveBg, borderColor: themeActiveBorder }]}
                onPress={() => setWaterLevel(l)}
              >
                <Text style={[styles.bigChipText, waterLevel === l && { color: themeActiveBorder, fontWeight: 'bold' }]}>
                  {waterLevel === l ? `✓ ${l}` : l}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.subLabel, { color: themePrimary }]}>รายละเอียดเรื่องน้ำเพิ่มเติม:</Text>
          <View style={[styles.speechInputContainer, { borderColor: themeBorder }]}>
            <TextInput
              style={styles.speechInput}
              placeholder="พิมพ์เพิ่มเติม หรือกดไมค์เพื่อพูด..."
              value={waterNote}
              onChangeText={setWaterNote}
              multiline
            />
            <TouchableOpacity style={[styles.micBtn, { backgroundColor: themePrimary }]} onPress={() => handleSpeechToText(waterNote, setWaterNote, 'การจัดการน้ำ')}>
              <Text style={styles.micBtnText}>{listeningSection === 'การจัดการน้ำ' ? '🔴 กำลังฟัง... (กดเพื่อหยุด)' : '🎙️ พูดเพื่อพิมพ์'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 5. แรงงาน */}
        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { color: themePrimary }]}>👨‍🌾 5. ผู้ปฏิบัติงาน & เครื่องจักร</Text>
          <View style={styles.chipGroup}>
            {['ทำเองในครัวเรือน', 'จ้างแรงงาน', 'กลุ่มวานแรง'].map((wrk) => (
              <TouchableOpacity
                key={wrk}
                style={[styles.bigChip, workerType === wrk && { backgroundColor: themeActiveBg, borderColor: themeActiveBorder }]}
                onPress={() => setWorkerType(wrk)}
              >
                <Text style={[styles.bigChipText, workerType === wrk && { color: themeActiveBorder, fontWeight: 'bold' }]}>
                  {workerType === wrk ? `✓ ${wrk}` : wrk}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.subLabel, { color: themePrimary }]}>รายละเอียดผู้ปฏิบัติงานเพิ่มเติม:</Text>
          <View style={[styles.speechInputContainer, { borderColor: themeBorder }]}>
            <TextInput
              style={styles.speechInput}
              placeholder="พิมพ์เพิ่มเติม หรือกดไมค์เพื่อพูด..."
              value={workerNote}
              onChangeText={setWorkerNote}
              multiline
            />
            <TouchableOpacity style={[styles.micBtn, { backgroundColor: themePrimary }]} onPress={() => handleSpeechToText(workerNote, setWorkerNote, 'แรงงานเครื่องจักร')}>
              <Text style={styles.micBtnText}>{listeningSection === 'แรงงานเครื่องจักร' ? '🔴 กำลังฟัง... (กดเพื่อหยุด)' : '🎙️ พูดเพื่อพิมพ์'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 6. ความชื้น */}
        {isOfficer && (
          <View style={[styles.card, { borderColor: themeBorder, borderWidth: 2 }]}>
            <Text style={[styles.sectionTitle, { color: themePrimary }]}>💧 6. ระบุค่าความชื้น (Option)</Text>
            <Text style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
              หากกรอกความชื้นด้วย ระบบจะปลดล็อกสถานะ "วัดความชื้น" ให้เกษตรกรทันที
            </Text>
            <TextInput
              style={[styles.speechInput, { borderColor: themePrimary, fontWeight: 'bold' }]}
              placeholder="ระบุค่าความชื้น (%) เช่น 14.5"
              keyboardType="numeric"
              value={moistureValue}
              onChangeText={setMoistureValue}
            />
          </View>
        )}

        {/* ปุ่มบันทึก */}
        <TouchableOpacity style={[styles.saveBtnLarge, { backgroundColor: themeSecondary }]} onPress={handleSave}>
          <Text style={styles.saveBtnTextLarge}>
            {initialData ? '💾 บันทึกการแก้ไข' : '💾 กดเพื่อบันทึกข้อมูล'}
          </Text>
        </TouchableOpacity>

      </ScrollView>

      {/* MODAL เลือกวัน/เดือน/ปี */}
      <Modal visible={activePickerModal !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={[styles.modalTitle, { color: themePrimary }]}>
              {activePickerModal === 'day' && 'เลือกวัน'}
              {activePickerModal === 'month' && 'เลือกเดือน'}
              {activePickerModal === 'year' && 'เลือกปี พ.ศ.'}
            </Text>

            <ScrollView style={{ maxHeight: 250, marginVertical: 10 }}>
              {activePickerModal === 'day' &&
                daysList.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.pickerItem, day === d && { backgroundColor: themeActiveBg }]}
                    onPress={() => {
                      setDay(d);
                      setActivePickerModal(null);
                    }}
                  >
                    <Text style={[styles.pickerItemText, day === d && { color: themePrimary, fontWeight: 'bold' }]}>
                      วันที่ {d}
                    </Text>
                  </TouchableOpacity>
                ))}

              {activePickerModal === 'month' &&
                monthsList.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.pickerItem, month === m.id && { backgroundColor: themeActiveBg }]}
                    onPress={() => {
                      setMonth(m.id);
                      setActivePickerModal(null);
                    }}
                  >
                    <Text style={[styles.pickerItemText, month === m.id && { color: themePrimary, fontWeight: 'bold' }]}>
                      {m.name}
                    </Text>
                  </TouchableOpacity>
                ))}

              {activePickerModal === 'year' &&
                yearsList.map((y) => (
                  <TouchableOpacity
                    key={y}
                    style={[styles.pickerItem, year === y && { backgroundColor: themeActiveBg }]}
                    onPress={() => {
                      setYear(y);
                      setActivePickerModal(null);
                    }}
                  >
                    <Text style={[styles.pickerItemText, year === y && { color: themePrimary, fontWeight: 'bold' }]}>
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