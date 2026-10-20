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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { USERS as DEFAULT_USERS } from '../data/users';

const USERS_KEY = 'registered_users';

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

  // ดึงข้อมูลผู้ใช้งานทั้งหมด (Default + ที่สมัครใหม่)
  const getAllUsers = async () => {
    try {
      const stored = await AsyncStorage.getItem(USERS_KEY);
      const customUsers = stored ? JSON.parse(stored) : [];
      return [...DEFAULT_USERS, ...customUsers];
    } catch (e) {
      return DEFAULT_USERS;
    }
  };

  // จัดการการ Sign In
  const handleSignIn = async () => {
    if (!login.trim() || !pin) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    const allUsers = await getAllUsers();
    const found = allUsers.find(
      (u) => u.login === login.trim() && u.pin === pin
    );

    if (!found) {
      setError('เบอร์โทร/รหัสเจ้าหน้าที่ หรือรหัสผ่านไม่ถูกต้อง');
      return;
    }

    setError('');
    onLogin({ id: found.id, name: found.name, role: found.role });
  };

  // จัดการการ Sign Up
  const handleSignUp = async () => {
    if (!name.trim() || !phone.trim() || !dob || !newPin) {
      setError('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }

    const allUsers = await getAllUsers();
    const exists = allUsers.some((u) => u.login === phone.trim());

    if (exists) {
      setError('เบอร์โทร/รหัสนี้มีอยู่ในระบบแล้ว');
      return;
    }

    const newUser = {
      id: 'usr_' + Date.now().toString(),
      name: name.trim(),
      login: phone.trim(),
      dob: dob,
      pin: newPin,
      role: role,
    };

    try {
      const stored = await AsyncStorage.getItem(USERS_KEY);
      const customUsers = stored ? JSON.parse(stored) : [];
      const updatedUsers = [...customUsers, newUser];
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));

      setError('');
      onLogin({ id: newUser.id, name: newUser.name, role: newUser.role });
    } catch (e) {
      setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
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
              <Text style={styles.switchText}>Don't have an account?</Text>
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
            <TouchableOpacity style={styles.datePickerInput} onPress={showDatePicker}>
              <Text style={[styles.datePickerText, !dob && { color: '#a1a1a1' }]}>
                {dob ? `📅 ${dob}` : '📅 กดเพื่อเลือกวันเดือนปีเกิด'}
              </Text>
            </TouchableOpacity>

            {/* Modal ปฏิทินเลือกวันที่ */}
            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              onConfirm={handleConfirmDate}
              onCancel={hideDatePicker}
              confirmTextIOS="ตกลง"
              cancelTextIOS="ยกเลิก"
              maximumDate={new Date()} // ป้องกันเลือกวันที่ในอนาคต
            />

            <Text style={styles.inputLabel}>Password (PIN)</Text>
            <TextInput
              style={styles.input}
              value={newPin}
              onChangeText={setNewPin}
              secureTextEntry
              keyboardType="number-pad"
              placeholder="รหัสผ่าน 4 หลัก"
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