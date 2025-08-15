import { useState, useCallback, useMemo } from 'react';
import { useSignIn, useSignUp } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { optimizedHaptic } from '~/lib/haptic-optimizer';
import { useTranslation } from './useTranslation';

interface UseAuthFormProps {
  mode: 'signin' | 'signup';
  onSuccess?: () => void;
}

interface AuthFormData {
  email: string;
  password: string;
  name?: string;
}

interface AuthFormErrors {
  email?: string;
  password?: string;
  name?: string;
  general?: string;
}

export function useAuthForm({ mode, onSuccess }: UseAuthFormProps) {
  const { t } = useTranslation();
  const {
    signIn,
    setActive: setSignInActive,
    isLoaded: signInLoaded,
  } = useSignIn();
  const {
    signUp,
    setActive: setSignUpActive,
    isLoaded: signUpLoaded,
  } = useSignUp();
  const router = useRouter();

  const [form, setForm] = useState<AuthFormData>({
    email: '',
    password: '',
    name: mode === 'signup' ? '' : undefined,
  });

  const [errors, setErrors] = useState<AuthFormErrors>({});
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  // Shared error shake animation
  const shakeX = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ translateX: shakeX.value }],
    };
  });

  const triggerErrorShake = useCallback(() => {
    optimizedHaptic.error();
    shakeX.value = withSpring(-10, {}, () => {
      shakeX.value = withSpring(10, {}, () => {
        shakeX.value = withSpring(0);
      });
    });
  }, [shakeX]);

  // Form validation
  const validation = useMemo(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = emailRegex.test(form.email.trim());
    const isPasswordValid = form.password.length >= 8;
    const isNameValid =
      mode === 'signin' || (form.name && form.name.trim().length > 0);

    return {
      email: isEmailValid,
      password: isPasswordValid,
      name: isNameValid,
      isValid: isEmailValid && isPasswordValid && isNameValid,
    };
  }, [form, mode]);

  // Update form field
  const updateForm = useCallback(
    (field: keyof AuthFormData, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  // Validate form and set errors
  const validateForm = useCallback(() => {
    const newErrors: AuthFormErrors = {};

    if (!validation.email) {
      newErrors.email = t('auth.validation.invalidEmail');
    }
    if (!validation.password) {
      newErrors.password = t('auth.validation.passwordTooShort');
    }
    if (mode === 'signup' && !validation.name) {
      newErrors.name = t('auth.validation.nameRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [validation, mode]);

  // Handle sign in
  const handleSignIn = useCallback(async () => {
    if (!signInLoaded) return;

    const trimmedEmail = form.email.trim().toLowerCase();
    const trimmedPassword = form.password.trim();

    try {
      const completeSignIn = await signIn.create({
        identifier: trimmedEmail,
        password: trimmedPassword,
      });

      await setSignInActive({ session: completeSignIn.createdSessionId });
      onSuccess?.() || router.replace('/tabs/chat');
    } catch (err: any) {
      if (__DEV__) {
        console.error('Sign in error:', err);
      }
      const errorMessage =
        err.errors?.[0]?.message ||
        err.message ||
        t('auth.errors.signInFailed');
      Alert.alert(t('common.error'), errorMessage);
      throw err;
    }
  }, [signIn, setSignInActive, signInLoaded, form, onSuccess, router]);

  // Handle sign up
  const handleSignUp = useCallback(async () => {
    if (!signUpLoaded) return;

    const trimmedEmail = form.email.trim().toLowerCase();
    const trimmedPassword = form.password.trim();

    try {
      await signUp.create({
        emailAddress: trimmedEmail,
        password: trimmedPassword,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      if (__DEV__) {
        console.error('Sign up error:', err);
      }
      const errorMessage =
        err.errors?.[0]?.message ||
        err.message ||
        t('auth.errors.signUpFailed');
      Alert.alert(t('common.error'), errorMessage);
      throw err;
    }
  }, [signUp, signUpLoaded, form]);

  // Handle email verification
  const handleVerification = useCallback(async () => {
    if (!signUpLoaded) return;

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      await setSignUpActive({ session: completeSignUp.createdSessionId });
      onSuccess?.() || router.replace('/tabs/chat');
    } catch (err: any) {
      if (__DEV__) {
        console.error('Verification error:', err);
      }
      const errorMessage =
        err.errors?.[0]?.message ||
        err.message ||
        t('auth.errors.verificationFailed');
      Alert.alert(t('common.error'), errorMessage);
      throw err;
    }
  }, [
    signUp,
    setSignUpActive,
    signUpLoaded,
    verificationCode,
    onSuccess,
    router,
  ]);

  // Main submit handler
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      triggerErrorShake();
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      if (mode === 'signin') {
        await handleSignIn();
      } else {
        await handleSignUp();
      }
    } catch {
      triggerErrorShake();
    } finally {
      setLoading(false);
    }
  }, [mode, validateForm, triggerErrorShake, handleSignIn, handleSignUp]);

  const isLoaded = mode === 'signin' ? signInLoaded : signUpLoaded;

  return {
    // Form state
    form,
    errors,
    loading,
    isLoaded,
    pendingVerification,
    verificationCode,
    setVerificationCode,

    // Form actions
    updateForm,
    handleSubmit,
    handleVerification,

    // Validation
    validation,

    // Animation
    shakeStyle,
    triggerErrorShake,
  };
}
