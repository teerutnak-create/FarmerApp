import { StyleSheet } from 'react-native';

export const PRIMARY_COLOR = '#6b52ae';
export const DARK_PURPLE = '#1d1b54';
export const BG_COLOR = '#f3f0ff';

export const s = StyleSheet.create({
  page: {
    flexGrow: 1,
    backgroundColor: BG_COLOR,
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: PRIMARY_COLOR,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: DARK_PURPLE,
    marginBottom: 16,
    marginTop: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: DARK_PURPLE,
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 20,
    fontSize: 15,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#e0d6ff',
    marginBottom: 10,
  },
  bigBtn: {
    width: '100%',
    paddingVertical: 14,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    elevation: 2,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  bigBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logout: {
    fontSize: 15,
    color: PRIMARY_COLOR,
    fontWeight: 'bold',
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  timerBox: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  timerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  timerNum: {
    fontSize: 28,
    fontWeight: 'bold',
    color: DARK_PURPLE,
    marginTop: 4,
  },
  timerHint: {
    fontSize: 13,
    color: '#ef4444',
    marginTop: 4,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  row: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: DARK_PURPLE,
  },
  rowTime: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  clear: {
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 20,
    fontWeight: 'bold',
  },
});