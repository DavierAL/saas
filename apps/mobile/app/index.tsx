import { Redirect } from 'expo-router';
import { useAuth } from '../src/providers/AppProvider';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@saas-pos/ui';

/**
 * Root Index — Redirige automáticamente al grupo (tabs) o (auth).
 * Usamos un Redirect declarativo para evitar errores de Navigator.
 */
export default function RootIndex() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg.base }}>
        <ActivityIndicator color={colors.accent.green} />
      </View>
    );
  }

  // Redirección declarativa según sesión
  return <Redirect href={session ? "/(tabs)" : "/(auth)/login"} />;
}
