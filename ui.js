import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export function Chip({ label, selected, onPress }) {
  return (
    <TouchableOpacity style={[u.chip, selected && u.chipOn]} onPress={onPress}>
      <Text style={[u.chipText, selected && u.chipTextOn]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Stepper({ value, onChange, step = 1, min = 0, max = 99999, unit }) {
  const down = () => onChange(Math.max(min, +(value - step).toFixed(2)));
  const up = () => onChange(Math.min(max, +(value + step).toFixed(2)));
  return (
    <View style={u.stepper}>
      <TouchableOpacity style={u.stepBtn} onPress={down}>
        <Text style={u.stepText}>−</Text>
      </TouchableOpacity>
      <Text style={u.qty}>{value}</Text>
      {unit ? <Text style={u.unit}>{unit}</Text> : null}
      <TouchableOpacity style={u.stepBtn} onPress={up}>
        <Text style={u.stepText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

export const u = StyleSheet.create({
  q: { fontSize: 20, fontWeight: 'bold', marginTop: 22, marginBottom: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    paddingVertical: 14, paddingHorizontal: 18, borderRadius: 14,
    borderWidth: 2, borderColor: '#d1d5db', backgroundColor: '#fff',
    marginRight: 10, marginBottom: 10,
  },
  chipOn: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  chipText: { fontSize: 18, color: '#111827' },
  chipTextOn: { color: '#fff', fontWeight: 'bold' },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepBtn: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#e5e7eb',
    justifyContent: 'center', alignItems: 'center',
  },
  stepText: { fontSize: 34, fontWeight: 'bold' },
  qty: { fontSize: 38, fontWeight: 'bold', marginLeft: 24 },
  unit: { fontSize: 18, marginLeft: 8, marginRight: 24 },
});