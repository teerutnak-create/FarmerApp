import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { signIn, signUp } from '../services/localAuthService';

export default function LoginScreen({ onLogin }) {
  // โหมดหน้าจอ: 'signin' หรือ 'signup'
  const [isSignUp, setIsSignUp] = useState(false);

  // ข้อมูลสำหรับ Sign In
  const [login, setLogin] = useState('');
  const [pin, setPin] = useState('');

  // ข้อมูลสำหรับ Sign Up
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState(''); // เก็บวันที่ในรูปแบบข้อความ (เช่น 15/08/2535)
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false); // ควบคุมเปิด/ปิด Modal ปฏิทิน
  const [newPin, setNewPin] = useState('');
  const [role, setRole] = useState('farmer'); // 'farmer' | 'officer'

  const [error, setError] = useState('');

  // ฟังก์ชันสำหรับการเลือกวันที่จากปฏิทิน
  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirmDate = (date) => {
    // แปลงวันที่ที่เลือกให้อยู่ในรูปแบบ DD/MM/YYYY (พ.ศ.)
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear() + 543; // แปลง ค.ศ. เป็น พ.ศ.
    setDob(`${day}/${month}/${year}`);
    hideDatePicker();
  };

  const normalizeWebDob = (value) => {
    const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
    if (!match) return null;

    const first = Number(match[1]);
    const second = Number(match[2]);
    const yearBE = Number(match[3]);
    const year = yearBE - 543;
    if (year < 1) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const toStoredDob = (day, month) => {
      const birthDate = new Date(year, month - 1, day);
      if (
        birthDate.getFullYear() !== year ||
        birthDate.getMonth() !== month - 1 ||
        birthDate.getDate() !== day ||
        birthDate > today
      ) {
        return null;
      }

      return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${yearBE}`;
    };

    return toStoredDob(first, second) || toStoredDob(second, first);
  };

  const getWebDateValue = () => {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dob);
    if (!match) return '';

    const [, day, month, yearBE] = match;
    return `${Number(yearBE) - 543}-${month}-${day}`;
  };

  const getMaxWebDate = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const handleWebDateChange = (event) => {
    const value = event.target.value;
    if (!value) {
      setDob('');
      return;
    }

    const [year, month, day] = value.split('-');
    setDob(`${day}/${month}/${Number(year) + 543}`);
  };

  // จัดการการ Sign In
  const handleSignIn = async () => {
    if (!login.trim() || !pin) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      const user = await signIn(login, pin);
      setError('');
      onLogin(user);
    } catch (authError) {
      setError(
        authError.code === 'invalid_credentials' || authError.message === 'Invalid login credentials'
          ? 'เบอร์โทร/รหัสเจ้าหน้าที่ หรือรหัสผ่านไม่ถูกต้อง'
          : authError.message || 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองอีกครั้ง'
      );
    }
  };

  // จัดการการ Sign Up
  const handleSignUp = async () => {
    if (!name.trim() || !phone.trim() || !dob || !newPin) {
      setError('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }

    let normalizedDob = dob;
    if (Platform.OS === 'web') {
      normalizedDob = normalizeWebDob(dob);
      if (!normalizedDob) {
        setError('กรุณากรอกวันเกิดเป็น วัน/เดือน/ปี หรือ เดือน/วัน/ปี พ.ศ. และห้ามเป็นวันที่ในอนาคต');
        return;
      }
    }

    if (newPin.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 หลัก');
      return;
    }

    try {
      const user = await signUp({
        name: name.trim(),
        phone: phone.trim(),
        dob: normalizedDob,
        password: newPin,
        role,
      });
      setError('');
      onLogin(user);
    } catch (authError) {
      setError(
        authError.code === '23505'
          ? 'เบอร์โทร/รหัสนี้มีอยู่ในระบบแล้ว'
          : authError.message || 'สมัครสมาชิกไม่สำเร็จ กรุณาลองอีกครั้ง'
      );
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#72c07b" />

      {/* ลวดลายตกแต่งพื้นหลังแบบเรขาคณิต (Background Shapes) */}
      <View style={[styles.shapeCircle, { top: 60, left: 25 }]} />
      <View style={[styles.shapeTriangle, { top: 120, right: 40 }]} />
      <View style={[styles.shapePill, { top: 140, right: -20, transform: [{ rotate: '-45deg' }] }]} />
      <View style={[styles.shapeCircle, { bottom: 180, right: 30 }]} />
      <View style={[styles.shapeTriangle, { bottom: 80, left: 30 }]} />
      <View style={[styles.shapePill, { bottom: 120, left: -30, transform: [{ rotate: '45deg' }] }]} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ไอคอนโปรไฟล์วงกลมด้านบน */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarOuter}>
            <View style={styles.avatarHead} />
            <View style={styles.avatarBody} />
          </View>
        </View>

        {!isSignUp ? (
          /* ==================== หน้า SIGN IN ==================== */
          <View style={styles.formContainer}>
            <Text style={styles.inputLabel}>Username / Phone</Text>
            <TextInput
              style={styles.input}
              value={login}
              onChangeText={setLogin}
              autoCapitalize="none"
              placeholder="0811111111"
              placeholderTextColor="#a1a1a1"
            />

            <Text style={styles.inputLabel}>Password (PIN)</Text>
            <TextInput
              style={styles.input}
              value={pin}
              onChangeText={setPin}
              secureTextEntry
              keyboardType="number-pad"
              placeholder="••••"
              placeholderTextColor="#a1a1a1"
            />

            {error !== '' && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>

            {/* ส่วนสลับไปหน้า Sign Up */}
            <View style={styles.switchContainer}>
              <Text style={styles.switchText}>Don&apos;t have an account?</Text>
              <TouchableOpacity style={styles.signUpButton} onPress={toggleMode}>
                <Text style={styles.signUpButtonText}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.hintBox}>
              <Text style={styles.hintTitle}>🌾 บัญชีทดลองระบบ</Text>
              <Text style={styles.hintText}>เกษตรกร: 0811111111 / 1234</Text>
              <Text style={styles.hintText}>เจ้าหน้าที่: officer01 / 9999</Text>
            </View>
          </View>
        ) : (
          /* ==================== หน้า SIGN UP ==================== */ 
          <View style={styles.formContainer}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="ชื่อ-นามสกุล"
              placeholderTextColor="#a1a1a1"
            />

            <Text style={styles.inputLabel}>Username / Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoCapitalize="none"
              placeholder="เบอร์โทรศัพท์"
              placeholderTextColor="#a1a1a1"
            />

            {/* ปุ่มกดเลือกวัน/เดือน/ปีเกิด แบบปฏิทิน */}
            <Text style={styles.inputLabel}>Date of Birth (วัน/เดือน/ปีเกิด)</Text>
            {Platform.OS === 'web' ? (
              React.createElement('input', {
                type: 'date',
                value: getWebDateValue(),
                max: getMaxWebDate(),
                onChange: handleWebDateChange,
                'aria-label': 'วันเดือนปีเกิด',
                style: {
                  width: '100%',
                  height: 48,
                  boxSizing: 'border-box',
                  backgroundColor: '#ffffff',
                  borderRadius: 24,
                  padding: '0 20px',
                  fontSize: 15,
                  color: '#333333',
                  marginBottom: 16,
                  border: 'none',
                },
              })
            ) : (
              <TouchableOpacity style={styles.datePickerInput} onPress={showDatePicker}>
                <Text style={[styles.datePickerText, !dob && { color: '#a1a1a1' }]}>
                  {dob ? `📅 ${dob}` : '📅 กดเพื่อเลือกวันเดือนปีเกิด'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Modal ปฏิทินเลือกวันที่ */}
            {Platform.OS !== 'web' && (
              <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={handleConfirmDate}
                onCancel={hideDatePicker}
                confirmTextIOS="ตกลง"
                cancelTextIOS="ยกเลิก"
                maximumDate={new Date()} // ป้องกันเลือกวันที่ในอนาคต
              />
            )}

            <Text style={styles.inputLabel}>Password (PIN)</Text>
            <TextInput
              style={styles.input}
              value={newPin}
              onChangeText={setNewPin}
              secureTextEntry
              keyboardType="number-pad"
              placeholder="รหัสผ่านอย่างน้อย 6 หลัก"
              placeholderTextColor="#a1a1a1"
            />

            <Text style={styles.inputLabel}>Select Role</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  role === 'farmer' && styles.roleOptionActive,
                ]}
                onPress={() => setRole('farmer')}
              >
                <Text
                  style={[
                    styles.roleText,
                    role === 'farmer' && styles.roleTextActive,
                  ]}
                >
                  เกษตรกร
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleOption,
                  role === 'officer' && styles.roleOptionActive,
                ]}
                onPress={() => setRole('officer')}
              >
                <Text
                  style={[
                    styles.roleText,
                    role === 'officer' && styles.roleTextActive,
                  ]}
                >
                  เจ้าหน้าที่
                </Text>
              </TouchableOpacity>
            </View>

            {error !== '' && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity style={styles.signInButton} onPress={handleSignUp}>
              <Text style={styles.signInButtonText}>Sign Up</Text>
            </TouchableOpacity>

            {/* ส่วนสลับกลับไปหน้า Sign In */}
            <View style={styles.switchContainer}>
              <Text style={styles.switchText}>Already have an account?</Text>
              <TouchableOpacity style={styles.signUpButton} onPress={toggleMode}>
                <Text style={styles.signUpButtonText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#72c07b',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  // --- Avatar (วงกลมโปรไฟล์) ---
  avatarContainer: {
    marginBottom: 25,
    alignItems: 'center',
  },
  avatarOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 3,
  },
  avatarHead: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#72c07b',
    marginBottom: 4,
  },
  avatarBody: {
    width: 70,
    height: 40,
    borderRadius: 35,
    backgroundColor: '#72c07b',
  },
  // --- Form & Inputs ---
  formContainer: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  inputLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginBottom: 6,
    marginLeft: 10,
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 20,
    fontSize: 15,
    color: '#333333',
    marginBottom: 16,
  },
  datePickerInput: {
    width: '100%',
    height: 48,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 20,
    justifyContent: 'center',
    marginBottom: 16,
  },
  datePickerText: {
    fontSize: 15,
    color: '#333333',
  },
  // --- Role Selector ---
  roleContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginBottom: 16,
  },
  roleOption: {
    flex: 1,
    height: 42,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  roleOptionActive: {
    backgroundColor: '#ffffff',
  },
  roleText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  roleTextActive: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  // --- Buttons ---
  signInButton: {
    width: 140,
    height: 44,
    backgroundColor: '#2e7d32',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  signInButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchContainer: {
    alignItems: 'center',
    marginTop: 25,
  },
  switchText: {
    color: '#e8f5e9',
    fontSize: 13,
    marginBottom: 10,
  },
  signUpButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 28,
    paddingVertical: 8,
    borderRadius: 12,
  },
  signUpButtonText: {
    color: '#2e7d32',
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#fef08a',
    fontSize: 13,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
  // --- Hint Box ---
  hintBox: {
    marginTop: 30,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  hintTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  hintText: {
    color: '#f1f8e9',
    fontSize: 11,
  },
  // --- Geometric Shapes (ลวดลายพื้นหลัง) ---
  shapeCircle: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  shapeTriangle: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 22,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(255, 255, 255, 0.25)',
  },
  shapePill: {
    position: 'absolute',
    width: 80,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
});