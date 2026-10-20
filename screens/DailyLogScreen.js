import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Constants from 'expo-constants';
import DateTimePicker from '@react-native-community/datetimepicker';

const isExpoGo = Constants.appOwnership === 'expo';

let Voice = null;
if (!isExpoGo) {
  try {
    Voice = require('@react-native-voice/voice').default;
  } catch (error) {
    console.log('Voice module load error:', error);
  }
}

export default function DailyLogScreen({ onClose, onSaveLog }) {
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [selectedCategories, setSelectedCategories] = useState(['การรดน้ำ']);
  const [selectedQuickOptions, setSelectedQuickOptions] = useState([]);
  const [additionalText, setAdditionalText] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const categoryData = {
    'การรดน้ำ': ['รดน้ำเช้า', 'รดน้ำเย็น', 'รดน้ำรอบพิเศษ', 'งดรดน้ำ (ฝนตก)', 'ระบบสปริงเกอร์', 'ระบบน้ำหยด'],
    'การใส่ปุ๋ย': ['ใส่ปุ๋ยคอก/ปุ๋ยหมัก', 'ใส่ปุ๋ยเคมีสูตรเสมอ 16-16-16', 'ใส่ปุ๋ยสูตรเร่งดอก/ผล', 'พ่นปุ๋ยทางใบ/ฮอร์โมน'],
    'การเก็บเกี่ยว': ['เก็บผลผลิตเกรด A', 'เก็บผลผลิตเกรด B', 'คัดเกรด/คัดไซส์', 'บรรจุลงกล่อง'],
    'ปัญหา/โรคพืช': ['พบแมลงศัตรูพืช', 'พบโรคใบจุด/ราแป้ง', 'วัชพืชขึ้นหนาแน่น', 'พืชขาดน้ำ/ใบเหี่ยว'],
    'รายรับ/รายจ่าย': ['ซื้อปุ๋ย/ยา', 'ค่าแรงงาน', 'ขายผลผลิต', 'ค่าขนส่ง'],
    'บันทึกทั่วไป': ['ตรวจแปลงประจำวัน', 'เตรียมดิน/พรวนดิน', 'ตัดแต่งกิ่ง', 'ซ่อมแซมระบบน้ำ'],
  };

  const categories = Object.keys(categoryData);

  useEffect(() => {
    if (isExpoGo || !Voice) return;

    Voice.onSpeechStart = () => setIsRecording(true);
    Voice.onSpeechEnd = () => setIsRecording(false);
    Voice.onSpeechResults = (e) => {
      if (e.value && e.value[0]) {
        setAdditionalText((prev) => (prev ? `${prev} ${e.value[0]}` : e.value[0]));
      }
    };
    Voice.onSpeechError = (e) => {
      setIsRecording(false);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกเสียงได้ โปรดลองอีกครั้ง');
    };

    return () => {
      if (Voice) {
        Voice.destroy().then(Voice.removeAllListeners);
      }
    };
  }, []);

  const toggleCategory = (cat) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length === 1) {
        Alert.alert('แจ้งเตือน', 'กรุณาเลือกอย่างน้อย 1 หมวดหมู่หลัก');
        return;
      }
      const updatedCategories = selectedCategories.filter((item) => item !== cat);
      setSelectedCategories(updatedCategories);

      const validOptions = Object.keys(categoryData)
        .filter((c) => updatedCategories.includes(c))
        .flatMap((c) => categoryData[c]);
      setSelectedQuickOptions(selectedQuickOptions.filter((opt) => validOptions.includes(opt)));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const toggleQuickOption = (option) => {
    if (selectedQuickOptions.includes(option)) {
      setSelectedQuickOptions(selectedQuickOptions.filter((item) => item !== option));
    } else {
      setSelectedQuickOptions([...selectedQuickOptions, option]);
    }
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const formatDate = (dateToFormat) => {
    const day = String(dateToFormat.getDate()).padStart(2, '0');
    const month = String(dateToFormat.getMonth() + 1).padStart(2, '0');
    const year = dateToFormat.getFullYear() + 543;
    return `${day}/${month}/${year}`;
  };

  const toggleRecording = async () => {
    if (isExpoGo || !Voice) {
      Alert.alert(
        'แจ้งเตือน Expo Go',
        'ปุ่มไมค์ในแอปไม่รองรับบน Expo Go กรุณาแตะช่องรายละเอียดเพิ่มเติมแล้วใช้ปุ่มรูปไมค์ที่คีย์บอร์ด iPhone แทนครับ',
        [{ text: 'ตกลง' }]
      );
      return;
    }

    try {
      if (isRecording) {
        await Voice.stop();
        setIsRecording(false);
      } else {
        await Voice.start('th-TH');
        setIsRecording(true);
      }
    } catch (error) {
      Alert.alert('เกิดข้อผิดพลาด', 'ระบบบันทึกเสียงมีปัญหา');
    }
  };

  const handleSave = () => {
    if (selectedQuickOptions.length === 0 && !additionalText.trim()) {
      Alert.alert('คำเตือน', 'กรุณาเลือกรายการย่อยอย่างน้อย 1 รายการ หรือระบุรายละเอียดเพิ่มเติม');
      return;
    }

    const categoriesText = selectedCategories.join(', ');
    const quickOptionsText = selectedQuickOptions.join(', ');
    const fullDetail = [quickOptionsText, additionalText.trim()].filter(Boolean).join(' | ');

    if (onSaveLog) {
      onSaveLog('บันทึกประจำวัน', {
        date: formatDate(date),
        category: categoriesText,
        detail: fullDetail,
      });
    }

    Alert.alert(
      'บันทึกสำเร็จ! ✅',
      `วันที่: ${formatDate(date)}\nหมวดหมู่: ${categoriesText}\nรายการ: ${fullDetail}`,
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
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Text style={styles.backButtonText}>← กลับ</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>บันทึกประจำวัน</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isExpoGo && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>
              💡 ใช้งานบน Expo Go: แตะช่องข้อความด้านล่าง แล้วใช้ปุ่มไมค์บนคีย์บอร์ดเพื่อพิมพ์ด้วยเสียง
            </Text>
          </View>
        )}

        {/* 1. เลือกวันที่ */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📅 วันที่บันทึก</Text>
          <TouchableOpacity style={styles.dateSelector} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateText}>📅 {formatDate(date)}</Text>
            <Text style={styles.dateHintText}>กดเพื่อเปลี่ยน</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker value={date} mode="date" display="default" onChange={onDateChange} />
          )}
        </View>

        {/* 2. เลือกหมวดหมู่หลัก */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.cardTitle}>📂 เลือกหมวดหมู่หลัก</Text>
            <Text style={styles.subHintText}>*(เลือกได้หลายหมวด)</Text>
          </View>

          <View style={styles.verticalCategoryContainer}>
            {categories.map((cat) => {
              const isSelected = selectedCategories.includes(cat);
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryCard, isSelected && styles.categoryCardSelected]}
                  onPress={() => toggleCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.categoryCardText, isSelected && styles.categoryCardTextSelected]}>
                    {isSelected ? '☑ ' : '☐ '}{cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 3. เลือกรายการย่อย */}
        {selectedCategories.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📌 รายการย่อยตามหมวดหมู่</Text>
            {selectedCategories.map((cat) => (
              <View key={cat} style={styles.categorySubGroup}>
                <Text style={styles.subCategoryTitle}>• {cat}</Text>
                <View style={styles.quickOptionContainer}>
                  {categoryData[cat].map((option) => {
                    const isSelected = selectedQuickOptions.includes(option);
                    return (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.quickOptionBtn,
                          isSelected && styles.quickOptionBtnSelected,
                        ]}
                        onPress={() => toggleQuickOption(option)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.quickOptionText, isSelected && styles.quickOptionTextSelected]}>
                          {isSelected ? '✓ ' : ''}{option}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 4. รายละเอียดเพิ่มเติม */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📝 รายละเอียดเพิ่มเติม / หมายเหตุ</Text>
          <TextInput
            style={styles.textInput}
            multiline
            placeholder="พิมพ์รายละเอียดเพิ่มเติม หรือใช้ไมค์คีย์บอร์ดพูด..."
            placeholderTextColor="#94a3b8"
            value={additionalText}
            onChangeText={setAdditionalText}
          />

          {/* 5. ปุ่มไมค์ */}
          <TouchableOpacity
            style={[
              styles.micButton,
              isRecording && styles.micButtonActive,
              isExpoGo && styles.micButtonDisabled,
            ]}
            onPress={toggleRecording}
            activeOpacity={0.8}
          >
            {isRecording ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.micButtonText}>
                {isExpoGo ? '🎙️ ปุ่มไมค์ (แนะนำใช้ไมค์คีย์บอร์ด)' : '🎙️ กดเพื่อพูดบันทึกเสียง'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 6. ปุ่มบันทึกข้อมูล */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
          <Text style={styles.saveButtonText}>
            💾 บันทึกข้อมูล ({selectedCategories.length} หมวด / {selectedQuickOptions.length} รายการ)
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4', // พื้นหลังเขียวอ่อน สบายตา
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
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#166534',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#14532d',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  warningBanner: {
    backgroundColor: '#dcfce7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  warningText: {
    color: '#166534',
    fontSize: 13,
    lineHeight: 18,
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subHintText: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '500',
    marginBottom: 12,
  },
  dateSelector: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#15803d',
  },
  dateHintText: {
    fontSize: 12,
    color: '#16a34a',
  },
  verticalCategoryContainer: {
    gap: 8,
  },
  categoryCard: {
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  categoryCardSelected: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  categoryCardText: {
    fontSize: 15,
    color: '#15803d',
    fontWeight: '500',
  },
  categoryCardTextSelected: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  categorySubGroup: {
    marginBottom: 14,
  },
  subCategoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 8,
  },
  quickOptionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickOptionBtn: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  quickOptionBtnSelected: {
    backgroundColor: '#dcfce7',
    borderColor: '#16a34a',
  },
  quickOptionText: {
    fontSize: 13,
    color: '#475569',
  },
  quickOptionTextSelected: {
    color: '#15803d',
    fontWeight: 'bold',
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    minHeight: 90,
    textAlignVertical: 'top',
    fontSize: 15,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginBottom: 12,
  },
  micButton: {
    backgroundColor: '#15803d',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  micButtonActive: {
    backgroundColor: '#dc2626',
  },
  micButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  micButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
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
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});