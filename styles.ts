import { StyleSheet, Dimensions } from 'react-native';

export const PRIMARY_COLOR = '#6b52ae';
export const DARK_PURPLE = '#1d1b54';
export const BG_COLOR = '#f3f0ff';
export const CARD_BG = '#e9d5ff';

export const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PRIMARY_COLOR,
  },
  // Top Header (แถบสีม่วงเข้มด้านบนแบบในภาพ)
  headerBar: {
    height: 54,
    backgroundColor: DARK_PURPLE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    elevation: 4,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  // Banner Area (ส่วนแบนเนอร์ด้านบน)
  bannerContainer: {
    width: '100%',
    height: 140,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  bannerSub: {
    color: '#e9d5ff',
    fontSize: 13,
    marginTop: 4,
  },
  // List Body Container (ส่วนรายการการ์ดตรงกลาง)
  bodyList: {
    flex: 1,
    backgroundColor: BG_COLOR,
    padding: 12,
  },
  // Card Item แบบมีรูปภาพ/ไอคอนซ้าย และข้อความขวา (สไตล์รูปตัวอย่าง)
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0d6ff',
    elevation: 2,
    shadowColor: DARK_PURPLE,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemImageSquare: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: CARD_BG,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: DARK_PURPLE,
  },
  itemSubText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  // Bottom Navigation Bar
  bottomNav: {
    height: 60,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e0d6ff',
    elevation: 8,
  },
  navTab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTabActive: {
    backgroundColor: '#f3f0ff',
    borderTopWidth: 3,
    borderTopColor: PRIMARY_COLOR,
  },
  navIcon: {
    fontSize: 20,
  },
  navText: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  navTextActive: {
    color: PRIMARY_COLOR,
    fontWeight: 'bold',
  },
  // Standard UI Elements
  bigBtn: {
    width: '100%',
    paddingVertical: 12,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  bigBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    height: 44,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd6fe',
    marginVertical: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: DARK_PURPLE,
    marginTop: 8,
  },
});