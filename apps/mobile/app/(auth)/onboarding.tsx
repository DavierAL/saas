import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography, radius, Button } from '@saas-pos/ui';

export default function OnboardingScreen() {
  return (
    <View style={s.container}>
      <View style={s.card}>
        <View style={s.logoRow}>
          <View style={s.logoMark}>
            <Text style={s.logoLetter}>P</Text>
          </View>
          <Text style={s.logoText}>SaaS POS</Text>
        </View>

        <Text style={s.title}>¡Bienvenido!</Text>
        <Text style={s.subtitle}>
          Estamos configurando tu espacio de trabajo. En el siguiente paso podrás personalizar tu negocio.
        </Text>

        <Button
          label="Comenzar"
          onPress={() => router.replace('/(tabs)')}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.base,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.bg.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing[6],
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[6],
    gap: spacing[2.5],
  },
  logoMark: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.accent.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: { fontSize: 16, fontWeight: typography.weight.extrabold, color: colors.bg.base },
  logoText:   { fontSize: 16, fontWeight: typography.weight.bold, color: colors.text.primary, letterSpacing: typography.tracking.tight },
  title:    { fontSize: 24, fontWeight: typography.weight.bold, color: colors.text.primary, letterSpacing: typography.tracking.tight, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.text.muted, marginBottom: spacing[8], lineHeight: 20 },
});
