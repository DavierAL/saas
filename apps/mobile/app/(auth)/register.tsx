/**
 * Register Screen
 *
 * Design: Supabase auth UI — dark centered card, emerald CTA.
 * Connects to Supabase Auth for new account creation.
 */
import {
  View, Text, TextInput, Pressable,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Keyboard, ScrollView
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase/client';

type Field = 'fullName' | 'email' | 'password' | 'invitationCode';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [focused, setFocused] = useState<Field | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    Keyboard.dismiss();

    if (!fullName.trim() || !email.trim() || !password || !invitationCode.trim()) {
      setError('Completa todos los campos obligatorios.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Formato de email inválido.');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          invitation_code: invitationCode.trim()
        }
      }
    });

    setLoading(false);

    if (authError) {
      if (authError.message.includes('already registered')) {
         setError('Este email ya está registrado.');
      } else {
         setError('Ocurrió un error al crear la cuenta. Intenta nuevamente.');
      }
    } else {
      setSuccess(true);
    }
  };

  const inputStyle = (field: Field) => [
    s.input,
    focused === field && s.inputFocused,
    error && s.inputError,
  ];

  if (success) {
    return (
      <View style={s.container}>
        <View style={s.card}>
          <View style={s.logoRow}>
            <View style={s.logoMark}>
              <Text style={s.logoLetter}>P</Text>
            </View>
            <Text style={s.logoText}>SaaS POS</Text>
          </View>
          <Text style={s.title}>¡Cuenta Creada!</Text>
          <Text style={s.subtitle}>
            Por favor, revisa tu bandeja de entrada para verificar tu cuenta antes de iniciar sesión.
          </Text>
          <Pressable style={s.btn} onPress={() => router.replace('/(auth)/login')}>
            <Text style={s.btnText}>Volver al login</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <View style={s.logoRow}>
            <View style={s.logoMark}>
              <Text style={s.logoLetter}>P</Text>
            </View>
            <Text style={s.logoText}>SaaS POS</Text>
          </View>

          <Text style={s.title}>Crea tu cuenta</Text>
          <Text style={s.subtitle}>Únete a tu equipo de trabajo</Text>

          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Full Name */}
          <View style={s.fieldGroup}>
            <Text style={s.label}>Nombre Completo</Text>
            <TextInput
              style={inputStyle('fullName')}
              placeholder="Ej. Juan Pérez"
              placeholderTextColor="#3a3a3a"
              value={fullName}
              onChangeText={(txt) => { setFullName(txt); setError(null); }}
              onFocus={() => setFocused('fullName')}
              onBlur={() => setFocused(null)}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          {/* Email */}
          <View style={s.fieldGroup}>
            <Text style={s.label}>Email</Text>
            <TextInput
              style={inputStyle('email')}
              placeholder="correo@empresa.com"
              placeholderTextColor="#3a3a3a"
              value={email}
              onChangeText={(txt) => { setEmail(txt); setError(null); }}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="next"
            />
          </View>

          {/* Password */}
          <View style={s.fieldGroup}>
            <Text style={s.label}>Contraseña</Text>
            <View style={[inputStyle('password'), { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 8 }]}>
              <TextInput
                style={{ flex: 1, color: '#ededed', fontSize: 14, height: '100%' }}
                placeholder="••••••••"
                placeholderTextColor="#3a3a3a"
                value={password}
                onChangeText={(txt) => { setPassword(txt); setError(null); }}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                secureTextEntry={!showPassword}
                returnKeyType="next"
              />
              <Pressable hitSlop={10} onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#9b9b9b" />
              </Pressable>
            </View>
            <Text style={s.helperText}>Mínimo 8 caracteres</Text>
          </View>

          {/* Invitation Code */}
          <View style={s.fieldGroup}>
            <Text style={s.label}>Código de Invitación (Tenant)</Text>
            <TextInput
              style={inputStyle('invitationCode')}
              placeholder="ABC-1234"
              placeholderTextColor="#3a3a3a"
              value={invitationCode}
              onChangeText={(txt) => { setInvitationCode(txt); setError(null); }}
              onFocus={() => setFocused('invitationCode')}
              onBlur={() => setFocused(null)}
              autoCapitalize="characters"
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />
          </View>

          {/* CTA */}
          <Pressable
            style={({ pressed }) => [
              s.btn,
              pressed && s.btnPressed,
              loading && s.btnDisabled,
            ]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0f0f0f" />
            ) : (
              <Text style={s.btnText}>Crear cuenta</Text>
            )}
          </Pressable>

          {/* Footer actions */}
          <View style={{ gap: 12, marginTop: 8 }}>
            <Pressable onPress={() => router.back()}>
              <Text style={s.footer}>
                ¿Ya tienes una cuenta? <Text style={{ color: '#ededed', fontWeight: 'bold' }}>Iniciar sesión</Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1c1c1c',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#272727',
    padding: 28,
  },

  // Logo
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 10,
  },
  logoMark: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#3ECF8E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: { fontSize: 16, fontWeight: '800', color: '#0f0f0f' },
  logoText:   { fontSize: 16, fontWeight: '700', color: '#ededed', letterSpacing: -0.3 },

  // Header
  title:    { fontSize: 20, fontWeight: '700', color: '#ededed', letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#666', marginBottom: 24 },

  // Error
  errorBox: {
    backgroundColor: '#2b0d0d',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EF444440',
    padding: 12,
    marginBottom: 16,
  },
  errorText: { fontSize: 13, color: '#EF4444' },

  // Form
  fieldGroup:   { marginBottom: 16 },
  label:        { fontSize: 12, fontWeight: '500', color: '#9b9b9b', marginBottom: 6, letterSpacing: 0.3 },
  input: {
    height: 42,
    backgroundColor: '#0f0f0f',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#272727',
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#ededed',
  },
  inputFocused: { borderColor: '#3ECF8E' },
  inputError:   { borderColor: '#EF444460' },
  helperText:   { fontSize: 11, color: '#555', marginTop: 6 },

  // Button
  btn: {
    height: 44,
    backgroundColor: '#3ECF8E',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  btnPressed:  { backgroundColor: '#2EBF7E' },
  btnDisabled: { opacity: 0.7 },
  btnText:     { fontSize: 15, fontWeight: '700', color: '#0f0f0f' },

  footer: { fontSize: 12, color: '#444', textAlign: 'center', lineHeight: 18 },
});
