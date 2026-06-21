import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';

type Mode = 'login' | 'signup' | 'forgot';

export function LoginScreen() {
  const { login, signup } = useAuth();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const topPad = isWeb ? 60 : insets.top;

  const handleLogin = async () => {
    setError('');
    setSuccess('');
    if (!emailOrUsername.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const result = await login(emailOrUsername, password);
    setLoading(false);
    if (!result.success) setError(result.error ?? 'Login failed.');
  };

  const handleSignup = async () => {
    setError('');
    setSuccess('');
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const result = await signup(name, email, password);
    setLoading(false);
    if (!result.success) setError(result.error ?? 'Signup failed.');
  };

  const handleForgotPassword = () => {
    setError('');
    setSuccess('');
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setSuccess(`If an account exists for ${email.trim()}, you will receive a password reset email shortly.`);
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#EEF6F9', '#F8F6F1', '#FDF9F3']}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: topPad }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoArea}>
            <View style={styles.crossWrap}>
              <LinearGradient colors={['#4A90A4', '#27AE60']} style={styles.crossBg}>
                <Feather name="heart" size={28} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.logoText}>
              <Text style={styles.logoGrace}>Grace</Text>
              <Text style={styles.logoSocial}>Social</Text>
            </Text>
            <Text style={styles.tagline}>Share your faith journey</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Mode Title */}
            <Text style={styles.cardTitle}>
              {mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create account' : 'Reset password'}
            </Text>

            {mode === 'forgot' && (
              <Text style={styles.cardSubtitle}>
                Enter your email and we'll send you a link to reset your password.
              </Text>
            )}

            {/* Name field (signup only) */}
            {mode === 'signup' && (
              <View style={styles.inputWrap}>
                <Feather name="user" size={18} color="#8E8E8E" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#8E8E8E"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
            )}

            {/* Email / username field */}
            {mode === 'login' ? (
              <View style={styles.inputWrap}>
                <Feather name="mail" size={18} color="#8E8E8E" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email or username"
                  placeholderTextColor="#8E8E8E"
                  value={emailOrUsername}
                  onChangeText={setEmailOrUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  returnKeyType="next"
                />
              </View>
            ) : (
              <View style={styles.inputWrap}>
                <Feather name="mail" size={18} color="#8E8E8E" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor="#8E8E8E"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                />
              </View>
            )}

            {/* Password field (not on forgot) */}
            {mode !== 'forgot' && (
              <View style={styles.inputWrap}>
                <Feather name="lock" size={18} color="#8E8E8E" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Password"
                  placeholderTextColor="#8E8E8E"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType={mode === 'signup' ? 'next' : 'done'}
                  onSubmitEditing={mode === 'login' ? handleLogin : undefined}
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
                  <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color="#8E8E8E" />
                </TouchableOpacity>
              </View>
            )}

            {/* Confirm password (signup only) */}
            {mode === 'signup' && (
              <View style={styles.inputWrap}>
                <Feather name="lock" size={18} color="#8E8E8E" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#8E8E8E"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleSignup}
                />
              </View>
            )}

            {/* Forgot password link */}
            {mode === 'login' && (
              <TouchableOpacity style={styles.forgotRow} onPress={() => switchMode('forgot')}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            )}

            {/* Error message */}
            {error ? (
              <View style={styles.errorWrap}>
                <Feather name="alert-circle" size={14} color="#E53935" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Success message */}
            {success ? (
              <View style={styles.successWrap}>
                <Feather name="check-circle" size={14} color="#27AE60" />
                <Text style={styles.successText}>{success}</Text>
              </View>
            ) : null}

            {/* Primary action button */}
            <TouchableOpacity
              style={[styles.primaryBtn, { opacity: loading ? 0.8 : 1 }]}
              onPress={mode === 'login' ? handleLogin : mode === 'signup' ? handleSignup : handleForgotPassword}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {mode === 'login' ? 'Log in' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Back button for forgot */}
            {mode === 'forgot' && (
              <TouchableOpacity style={styles.backBtn} onPress={() => switchMode('login')}>
                <Feather name="arrow-left" size={16} color="#4A90A4" />
                <Text style={styles.backBtnText}>Back to login</Text>
              </TouchableOpacity>
            )}

            {/* OR divider (login/signup only) */}
            {mode !== 'forgot' && (
              <>
                <View style={styles.orRow}>
                  <View style={styles.orLine} />
                  <Text style={styles.orText}>OR</Text>
                  <View style={styles.orLine} />
                </View>

                <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8} onPress={() => {
                  Alert.alert('Coming Soon', 'Facebook login will be available soon. Please use email and password for now.');
                }}>
                  <View style={[styles.socialIcon, { backgroundColor: '#1877F2' }]}>
                    <Text style={styles.socialIconText}>f</Text>
                  </View>
                  <Text style={styles.socialBtnText}>Continue with Facebook</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.socialBtn, { borderColor: '#E5DDD0' }]} activeOpacity={0.8} onPress={() => {
                  Alert.alert('Coming Soon', 'Google login will be available soon. Please use email and password for now.');
                }}>
                  <View style={[styles.socialIcon, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd' }]}>
                    <Text style={[styles.socialIconText, { color: '#4285F4', fontSize: 14 }]}>G</Text>
                  </View>
                  <Text style={styles.socialBtnText}>Continue with Google</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Footer */}
          {mode !== 'forgot' && (
            <View style={[styles.footer, { paddingBottom: isWeb ? 24 : insets.bottom + 16 }]}>
              <Text style={styles.footerText}>
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              </Text>
              <TouchableOpacity onPress={() => switchMode(mode === 'login' ? 'signup' : 'login')}>
                <Text style={styles.footerLink}>{mode === 'login' ? 'Sign up.' : 'Log in.'}</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.terms}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F6F1' },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingBottom: 20, alignItems: 'center' },
  logoArea: { alignItems: 'center', marginBottom: 36, gap: 10 },
  crossWrap: { marginBottom: 4 },
  crossBg: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 32, letterSpacing: -0.5 },
  logoGrace: { fontFamily: 'Inter_700Bold', color: '#1C1C1E' },
  logoSocial: { fontFamily: 'Inter_700Bold', color: '#4A90A4' },
  tagline: { fontSize: 15, fontFamily: 'Inter_400Regular', color: '#6B6560' },
  card: { width: '100%', maxWidth: 380, gap: 12 },
  cardTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#1C1C1E', marginBottom: 4 },
  cardSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#6B6560', lineHeight: 20, marginBottom: 4 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5DDD0', paddingHorizontal: 14, height: 52, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', color: '#1C1C1E' },
  eyeBtn: { padding: 6 },
  forgotRow: { alignItems: 'flex-end' },
  forgotText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#4A90A4' },
  errorWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFEBEE', borderRadius: 8, padding: 10 },
  errorText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', color: '#E53935' },
  successWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#E8F5E9', borderRadius: 8, padding: 10 },
  successText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', color: '#27AE60' },
  primaryBtn: { height: 52, borderRadius: 12, backgroundColor: '#4A90A4', alignItems: 'center', justifyContent: 'center', shadowColor: '#4A90A4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  primaryBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
  backBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  backBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#4A90A4' },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orLine: { flex: 1, height: 0.5, backgroundColor: '#E5DDD0' },
  orText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#8E8E8E', letterSpacing: 1 },
  socialBtn: { flexDirection: 'row', alignItems: 'center', height: 52, borderRadius: 12, borderWidth: 1, borderColor: '#E5DDD0', backgroundColor: '#fff', paddingHorizontal: 16, gap: 12 },
  socialIcon: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  socialIconText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  socialBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#1C1C1E', flex: 1, textAlign: 'center' },
  footer: { flexDirection: 'row', alignItems: 'center', paddingTop: 32 },
  footerText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#6B6560' },
  footerLink: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#4A90A4' },
  terms: { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#9D9188', textAlign: 'center', paddingHorizontal: 20, paddingTop: 12, lineHeight: 16 },
});
