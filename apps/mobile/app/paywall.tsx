/**
 * Paywall Screen
 *
 * Shown when tenant's valid_until has passed.
 * The cashier CAN'T create new orders, but existing data is preserved.
 * The checkout use case already enforces this — this screen is the UI response.
 */
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { useAuth } from '../src/providers/AppProvider';
import { useTenant } from '../src/hooks/useTenant';
import { getSubscriptionStatus } from '@saas-pos/domain';

export default function PaywallScreen() {
  const { tenantId, signOut } = useAuth();
  const tenant = useTenant(tenantId ?? '');
  const status = tenant ? getSubscriptionStatus(tenant) : null;
  const expiredDays = status ? Math.abs(status.daysRemaining) : 0;

  return (
    <View style={s.container}>
      <View style={s.card}>
        {/* Icon */}
        <View style={s.iconWrap}>
          <Text style={s.icon}>⚠</Text>
        </View>

        <Text style={s.title}>Suscripción vencida</Text>

        <Text style={s.desc}>
          {tenant?.name
            ? `La suscripción de "${tenant.name}" venció hace ${expiredDays} día${expiredDays !== 1 ? 's' : ''}.`
            : 'Tu suscripción ha vencido.'}
        </Text>

        <Text style={s.note}>
          No se pueden registrar ventas nuevas. Tus datos están seguros y disponibles.
        </Text>

        <View style={s.divider} />

        {/* Contact CTA */}
        <Pressable
          style={({ pressed }) => [s.primaryBtn, pressed && s.primaryBtnPressed]}
          onPress={() => Linking.openURL('https://wa.me/?text=Hola,%20quiero%20renovar%20mi%20plan%20SaaS%20POS')}
        >
          <Text style={s.primaryBtnText}>Renovar suscripción</Text>
        </Pressable>

        <Pressable style={s.secondaryBtn} onPress={signOut}>
          <Text style={s.secondaryBtnText}>Cerrar sesión</Text>
        </Pressable>
      </View>

      {/* Bottom note */}
      <Text style={s.bottomNote}>
        El historial de ventas sigue disponible en modo lectura.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1c1c1c',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#272727',
    padding: 28,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2b1e0d',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: { fontSize: 26 },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ededed',
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  desc: {
    fontSize: 14,
    color: '#9b9b9b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  note: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#272727',
    marginBottom: 20,
  },

  primaryBtn: {
    width: '100%',
    height: 46,
    backgroundColor: '#3ECF8E',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  primaryBtnPressed: { backgroundColor: '#2EBF7E' },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#0f0f0f' },

  secondaryBtn: {
    width: '100%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { fontSize: 13, color: '#555' },

  bottomNote: { fontSize: 11, color: '#333', marginTop: 20, textAlign: 'center' },
});
