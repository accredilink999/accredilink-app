/**
 * Biometric Authentication Utilities
 *
 * NATIVE (Android/iOS): Uses capacitor-native-biometric for fingerprint / face.
 * WEB: Uses the Web Authentication API (WebAuthn) for fingerprint, Face ID, Windows Hello.
 *
 * Credential metadata is stored in localStorage so the login page
 * can detect whether biometric is available on this device.
 */

const STORAGE_KEY = 'biometric_credential';
const REFRESH_TOKEN_KEY = 'biometric_refresh_token';

function isNativePlatform() {
  return window.Capacitor?.isNativePlatform?.() === true;
}

// ---------------------------------------------------------------------------
// Support check
// ---------------------------------------------------------------------------

/** Check if the device supports platform biometrics */
export async function isBiometricSupported() {
  if (isNativePlatform()) {
    try {
      const { NativeBiometric } = await import('capacitor-native-biometric');
      const result = await NativeBiometric.isAvailable();
      return result.isAvailable === true;
    } catch {
      return false;
    }
  }

  // Web — use WebAuthn
  if (!window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/** Check if a biometric credential is registered on this device */
export function isBiometricEnabled() {
  return !!localStorage.getItem(STORAGE_KEY);
}

/** Get stored credential metadata */
export function getStoredCredential() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

/**
 * Register a new biometric credential for the current user.
 * Triggers the device's fingerprint / face prompt.
 */
export async function registerBiometric(userId, userName, userEmail) {
  if (isNativePlatform()) {
    return registerNativeBiometric(userId, userName, userEmail);
  }
  return registerWebAuthnBiometric(userId, userName, userEmail);
}

async function registerNativeBiometric(userId, userName, userEmail) {
  const { NativeBiometric } = await import('capacitor-native-biometric');

  // Verify the user can authenticate (triggers fingerprint/face prompt)
  await NativeBiometric.verifyIdentity({
    reason: 'Set up biometric login',
    title: 'Biometric Setup',
    subtitle: 'Confirm your identity to enable biometric login',
    useFallback: true,
  });

  // Store the credential on the native secure store
  await NativeBiometric.setCredentials({
    username: userEmail,
    password: userId, // we store userId as the "password" for lookup
    server: 'com.carecallai.app',
  });

  const meta = {
    type: 'native',
    userId,
    userName,
    userEmail,
    registeredAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
  return meta;
}

async function registerWebAuthnBiometric(userId, userName, userEmail) {
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'Care Call', id: window.location.hostname },
      user: {
        id: new TextEncoder().encode(userId),
        name: userEmail,
        displayName: userName,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },   // ES256
        { alg: -257, type: 'public-key' },  // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
    },
  });

  const meta = {
    type: 'webauthn',
    credentialId: Array.from(new Uint8Array(credential.rawId)),
    userId,
    userName,
    userEmail,
    registeredAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
  return meta;
}

// ---------------------------------------------------------------------------
// Authenticate
// ---------------------------------------------------------------------------

/**
 * Verify biometric on this device.
 * Returns { success: true, userId, userEmail } or throws.
 */
export async function authenticateBiometric() {
  const stored = getStoredCredential();
  if (!stored) throw new Error('No biometric credential on this device');

  if (stored.type === 'native' || isNativePlatform()) {
    return authenticateNativeBiometric(stored);
  }
  return authenticateWebAuthnBiometric(stored);
}

async function authenticateNativeBiometric(stored) {
  const { NativeBiometric } = await import('capacitor-native-biometric');

  await NativeBiometric.verifyIdentity({
    reason: 'Log in with biometrics',
    title: 'Biometric Login',
    subtitle: 'Confirm your identity',
    useFallback: true,
  });

  // Retrieve stored credentials
  const credentials = await NativeBiometric.getCredentials({
    server: 'com.carecallai.app',
  });

  return {
    success: true,
    userId: credentials.password, // we stored userId as password
    userEmail: credentials.username,
  };
}

async function authenticateWebAuthnBiometric(stored) {
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);

  await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: [{
        id: new Uint8Array(stored.credentialId),
        type: 'public-key',
        transports: ['internal'],
      }],
      userVerification: 'required',
      timeout: 60000,
    },
  });

  return { success: true, userId: stored.userId, userEmail: stored.userEmail };
}

// ---------------------------------------------------------------------------
// Token storage & cleanup
// ---------------------------------------------------------------------------

/** Store a refresh token for biometric re-login (survives sign-out) */
export function storeBiometricRefreshToken(refreshToken) {
  if (refreshToken && isBiometricEnabled()) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

/** Get stored biometric refresh token */
export function getBiometricRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/** Remove biometric credential from this device */
export async function removeBiometric() {
  if (isNativePlatform()) {
    try {
      const { NativeBiometric } = await import('capacitor-native-biometric');
      await NativeBiometric.deleteCredentials({ server: 'com.carecallai.app' });
    } catch {
      // ignore — credentials may not exist
    }
  }
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}
