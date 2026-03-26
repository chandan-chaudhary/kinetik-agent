import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from 'crypto';

/**
 * Derive a 32-byte AES-GCM key from a provided secret string using SHA-256.
 */
export function deriveAesGcmKey(secret: string): Buffer {
  if (!secret) {
    throw new Error('Encryption key is not set');
  }
  return createHash('sha256').update(secret).digest();
}

/**
 * Encrypt plaintext using AES-256-GCM. Returns iv:ciphertext:authTag (base64 encoded).
 */
export function encryptAesGcm(plainText: string, key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('base64')}:${encrypted.toString('base64')}:${authTag.toString('base64')}`;
}

/**
 * Decrypt an iv:ciphertext:authTag payload. Returns null when decryption fails.
 * If the payload is not in the expected format, the original string is returned for backward compatibility.
 */
export function decryptAesGcm(payload: string, key: Buffer): string | null {
  const parts = payload.split(':');
  if (parts.length !== 3) return payload;

  const [iv, encrypted, authTag] = parts;
  try {
    const decipher = createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(iv, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(authTag, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(encrypted, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    return null;
  }
}
