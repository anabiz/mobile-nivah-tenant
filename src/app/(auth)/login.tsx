import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormInput } from '@/components/ui/FormInput';
import { useAuth } from '@/contexts/AuthContext';
import { apiErrorMessage } from '@/lib/api';
import { authService, type VerifyOtpResponse } from '@/services/authService';

type Mode = 'password' | 'otp';

const ROLE_ERROR = 'This portal is for tenant and technician accounts only. Please use the staff portal to sign in.';

export default function LoginScreen() {
  const { completeLogin } = useAuth();
  const [mode, setMode] = useState<Mode>('password');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Password mode
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [requires2fa, setRequires2fa] = useState(false);
  const [twoFaOtp, setTwoFaOtp] = useState('');

  // OTP mode
  const [otpEmail, setOtpEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  async function finishLogin(data: VerifyOtpResponse) {
    const user = await completeLogin(data);
    if (user.roles.length === 0) {
      setError(ROLE_ERROR);
    }
    // Stack.Protected in the root layout reacts to `user` and redirects automatically.
  }

  async function handlePasswordLogin() {
    setError('');
    setIsLoading(true);
    try {
      const response = await authService.loginWithPassword(email.trim(), password);
      if (response.success && response.data?.requiresTwoFactor) {
        setRequires2fa(true);
        setInfo(response.message || 'Check your email for the verification code.');
        return;
      }
      if (response.success && response.data) {
        await finishLogin(response.data);
      } else {
        setError(response.message || 'Invalid email or password');
      }
    } catch (err) {
      setError(apiErrorMessage(err, 'Invalid email or password'));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerify2fa() {
    setError('');
    setIsLoading(true);
    try {
      const response = await authService.verifyOtp(email.trim(), twoFaOtp);
      if (response.success && response.data) {
        await finishLogin(response.data);
      } else {
        setError(response.message || 'Invalid verification code');
      }
    } catch (err) {
      setError(apiErrorMessage(err, 'Invalid verification code'));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSendOtp() {
    setError('');
    setIsLoading(true);
    try {
      const response = await authService.sendLoginOtp(otpEmail.trim());
      if (response.success) {
        setOtpSent(true);
        setInfo(response.message || 'Check your email for the login code.');
      } else {
        setError(response.message || 'Could not send code');
      }
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not send code'));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyLoginOtp() {
    setError('');
    setIsLoading(true);
    try {
      const response = await authService.verifyOtp(otpEmail.trim(), otp);
      if (response.success && response.data) {
        await finishLogin(response.data);
      } else {
        setError(response.message || 'Invalid verification code');
      }
    } catch (err) {
      setError(apiErrorMessage(err, 'Invalid verification code'));
    } finally {
      setIsLoading(false);
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError('');
    setInfo('');
    setRequires2fa(false);
    setOtpSent(false);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-[#eaf4ee]"
    >
      <ScrollView contentContainerClassName="flex-1 justify-center px-6 py-12" keyboardShouldPersistTaps="handled">
        <Image
          source={require('../../assets/nivah-logo.png')}
          className="mb-8 h-14 self-center"
          resizeMode="contain"
        />

        <View className="rounded-2xl bg-white p-6 shadow-sm">
          {mode === 'password' && !requires2fa && (
            <>
              <Text className="mb-4 text-center text-base font-semibold text-gray-900">Sign in</Text>
              {error ? <Text className="mb-3 text-center text-xs text-red-600">{error}</Text> : null}
              <View className="gap-3">
                <FormInput
                  label="Email"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                />
                <FormInput
                  label="Password"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                />
                <Button label={isLoading ? 'Signing in...' : 'Sign In'} onPress={handlePasswordLogin} loading={isLoading} />
                <Button label="Use a login code instead" variant="secondary" onPress={() => switchMode('otp')} />
              </View>
            </>
          )}

          {mode === 'password' && requires2fa && (
            <View className="gap-3">
              <Text className="text-center text-sm font-semibold text-gray-900">Two-Factor Authentication</Text>
              <Text className="text-center text-xs text-gray-500">Enter the verification code sent to your email</Text>
              {info ? <Text className="text-center text-xs text-green-600">{info}</Text> : null}
              {error ? <Text className="text-center text-xs text-red-600">{error}</Text> : null}
              <FormInput
                value={twoFaOtp}
                onChangeText={setTwoFaOtp}
                placeholder="Enter 6-digit code"
                maxLength={6}
                keyboardType="number-pad"
                className="text-center tracking-widest"
              />
              <Button
                label={isLoading ? 'Verifying...' : 'Verify'}
                onPress={handleVerify2fa}
                loading={isLoading}
                disabled={twoFaOtp.length < 4}
              />
              <Button label="Back to login" variant="secondary" onPress={() => switchMode('password')} />
            </View>
          )}

          {mode === 'otp' && !otpSent && (
            <View className="gap-3">
              <Text className="mb-1 text-center text-base font-semibold text-gray-900">Sign in with a code</Text>
              {error ? <Text className="text-center text-xs text-red-600">{error}</Text> : null}
              <FormInput
                label="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                value={otpEmail}
                onChangeText={setOtpEmail}
                placeholder="you@example.com"
              />
              <Button label={isLoading ? 'Sending...' : 'Send Code'} onPress={handleSendOtp} loading={isLoading} disabled={!otpEmail} />
              <Button label="Use password instead" variant="secondary" onPress={() => switchMode('password')} />
            </View>
          )}

          {mode === 'otp' && otpSent && (
            <View className="gap-3">
              <Text className="text-center text-sm font-semibold text-gray-900">Enter your code</Text>
              {info ? <Text className="text-center text-xs text-green-600">{info}</Text> : null}
              {error ? <Text className="text-center text-xs text-red-600">{error}</Text> : null}
              <FormInput
                value={otp}
                onChangeText={setOtp}
                placeholder="Enter 6-digit code"
                maxLength={6}
                keyboardType="number-pad"
                className="text-center tracking-widest"
              />
              <Button
                label={isLoading ? 'Verifying...' : 'Verify & Sign In'}
                onPress={handleVerifyLoginOtp}
                loading={isLoading}
                disabled={otp.length < 4}
              />
              <Button label="Back" variant="secondary" onPress={() => switchMode('otp')} disabled={isLoading} />
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
