export interface LoginCryptoParameters {
  version: 1;
  keyId: string;
  publicKey: string;
  challenge: string;
  expiresIn: number;
}

export interface LoginEnvelope {
  version: 1;
  keyId: string;
  challenge: string;
  wrappedKey: string;
  iv: string;
  ciphertext: string;
}

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export async function cifrarLogin(
  credentials: { correo: string; password: string },
  parameters: LoginCryptoParameters,
): Promise<LoginEnvelope> {
  if (!globalThis.crypto?.subtle) throw new Error('Este navegador no permite el inicio de sesión cifrado');
  if (parameters.version !== 1 || !parameters.keyId || !parameters.challenge || !parameters.publicKey) {
    throw new Error('No se pudieron obtener los parámetros de cifrado');
  }

  const publicKeyDer = Uint8Array.from(atob(parameters.publicKey), (char) => char.charCodeAt(0));
  const publicKey = await globalThis.crypto.subtle.importKey(
    'spki',
    publicKeyDer,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt'],
  );
  const aesKey = await globalThis.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']);
  const rawAesKey = new Uint8Array(await globalThis.crypto.subtle.exportKey('raw', aesKey));
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const additionalData = new TextEncoder().encode(`sigice-login:v1:${parameters.keyId}:${parameters.challenge}`);
  const cleartext = new TextEncoder().encode(JSON.stringify(credentials));

  try {
    const [wrappedKey, ciphertext] = await Promise.all([
      globalThis.crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, rawAesKey),
      globalThis.crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData, tagLength: 128 }, aesKey, cleartext),
    ]);
    return {
      version: 1,
      keyId: parameters.keyId,
      challenge: parameters.challenge,
      wrappedKey: base64Url(new Uint8Array(wrappedKey)),
      iv: base64Url(iv),
      ciphertext: base64Url(new Uint8Array(ciphertext)),
    };
  } finally {
    rawAesKey.fill(0);
    cleartext.fill(0);
  }
}
