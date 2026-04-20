/**
 * Paywall Screen
 *
 * Shown when tenant's valid_until has passed.
 * The cashier CAN'T create new orders, but existing data is preserved.
 * The checkout use case already enforces this — this screen is the UI response.
 */
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { useTenant } from '../src/hooks/useTenant';
import { getSubscriptionStatus } from '@saas-pos/domain';
import { useEffect, useState } from 'react';
import { supabase } from '../src/lib/supabase/client';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, radius, Button } from '@saas-pos/ui';
import { useAuth } from '../src/providers/AppProvider';

export default function PaywallScreen() {
  const { tenantId, signOut } = useAuth();
  const router = useRouter();
  const tenant = useTenant(tenantId ?? '');
  const [isVerifying, setIsVerifying] = useState(false);
  
  const status = tenant ? getSubscriptionStatus(tenant) : null;
  const expiredDays = status ? Math.abs(status.daysRemaining) : 0;

  useEffect(() => {
    if (!tenantId) return;

    const verifySubscription = async () => {
      setIsVerifying(true);
      try {
        const { data, error } = await supabase
          .from('tenants')
          .select('valid_until')
          .eq('id', tenantId)
          .single();

        if (data && !error) {
          const now = new Date();
          const validUntil = new Date(data.valid_until);
          
          if (validUntil > now) {
            router.replace('/(tabs)');
          }
        }
      } catch (err) {
        console.warn('[Paywall] Server check failed:', err);
      } finally {
        setIsVerifying(false);
      }
    };

    verifySubscription();
  }, [tenantId]);

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
        <Button
          label="Renovar suscripción"
          variant="primary"
          onPress={() => Linking.openURL('https://wa.me/?text=Hola,%20quiero%20renovar%20mi%20plan%20SaaS%20POS')}
          style={{ width: '100%', marginBottom: spacing[2] }}
        />

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
    backgroundColor: colors.bg.base,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.bg.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing[8],
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.accent.amberDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.accent.amber,
  },
  icon: { fontSize: 26, color: colors.accent.amber },

  title: {
    fontSize: 20,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    letterSpacing: typography.tracking.tight,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  desc: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing[2],
  },
  note: {
    fontSize: 13,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing[5],
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.border.default,
    marginBottom: spacing[5],
  },

  secondaryBtn: {
    width: '100%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { fontSize: 13, color: colors.text.muted },

  bottomNote: { fontSize: 11, color: colors.text.muted, marginTop: spacing[5], textAlign: 'center' },
});
