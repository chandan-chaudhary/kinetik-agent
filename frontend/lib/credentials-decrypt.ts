export async function deriveKey(secret: string) {
  const encoder = new TextEncoder();
  const secretData = encoder.encode(secret);
  const hash = await crypto.subtle.digest("SHA-256", secretData);
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, [
    "decrypt",
  ]);
}

export async function decryptApiKey(
  ciphertext?: string | null,
): Promise<string | null> {
  if (!ciphertext) return null;
  const parts = ciphertext.split(":");
  if (parts.length !== 3) return ciphertext; // legacy/plaintext fallback

  const [ivB64, cipherB64, tagB64] = parts;
  const secret = process.env.NEXT_PUBLIC_CREDENTIAL_ENCRYPTION_KEY;
  if (!secret) throw new Error("Missing encryption key");

  const iv = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0));
  const cipher = Uint8Array.from(atob(cipherB64), (c) => c.charCodeAt(0));
  const tag = Uint8Array.from(atob(tagB64), (c) => c.charCodeAt(0));

  // Node stored auth tag separately; Web Crypto expects it appended to ciphertext
  const combined = new Uint8Array(cipher.length + tag.length);
  combined.set(cipher, 0);
  combined.set(tag, cipher.length);

  const key = await deriveKey(secret);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    combined,
  );

  return new TextDecoder().decode(decrypted);
}