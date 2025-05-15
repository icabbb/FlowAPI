/**
 * Encryption service for sensitive data like environment variables
 * Uses the Web Crypto API for secure encryption/decryption
 */

// The salt used for key derivation
const SALT = new Uint8Array([
  0x32, 0x4a, 0x7c, 0x98, 0x12, 0x45, 0x90, 0xab, 
  0xcd, 0xef, 0x01, 0x23, 0x45, 0x67, 0x89, 0xab
]);

/**
 * Generates a cryptographic key from a user ID
 * This ensures each user has their own encryption key
 * @param userId The user's unique identifier
 * @returns A CryptoKey that can be used for encryption/decryption
 */
async function deriveKeyFromUserId(userId: string): Promise<CryptoKey> {
  // Convert the userId to an ArrayBuffer
  const encoder = new TextEncoder();
  const keyMaterial = encoder.encode(userId);
  
  // Import the userId as a key
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  // Derive a key suitable for AES-GCM
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: SALT,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a string using AES-GCM
 * @param text The text to encrypt
 * @param userId The user ID to derive the encryption key from
 * @returns An encrypted string (base64 encoded)
 */
export async function encryptText(text: string, userId: string): Promise<string> {
  try {
    const key = await deriveKeyFromUserId(userId);
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    // Generate a random IV for each encryption
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt the data
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      data
    );
    
    // Combine the IV and encrypted data
    const result = new Uint8Array(iv.length + encryptedData.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encryptedData), iv.length);
    
    // Convert to base64 for storage
    return btoa(String.fromCharCode(...new Uint8Array(result)));
  } catch (error) {
    
    // Return the original text if encryption fails
    // In production, you might want to handle this differently
    
    return text;
  }
}

/**
 * Decrypts a string encrypted with AES-GCM
 * @param encryptedText The encrypted text (base64 encoded)
 * @param userId The user ID to derive the decryption key from
 * @returns The decrypted string
 */
export async function decryptText(encryptedText: string, userId: string): Promise<string> {
  try {
    // Check if the text is likely encrypted (heuristic check)
    if (!encryptedText || encryptedText.length < 20) {
      return encryptedText; // Too short to be encrypted
    }
    
    const key = await deriveKeyFromUserId(userId);
    
    // Convert from base64
    const buffer = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
    
    // Extract the IV (first 12 bytes)
    const iv = buffer.slice(0, 12);
    // Extract the encrypted data (remaining bytes)
    const encryptedData = buffer.slice(12);
    
    // Decrypt the data
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      encryptedData
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {

    // Return the original text if decryption fails
    // This could happen if the text wasn't actually encrypted
    return encryptedText;
  }
}

/**
 * Checks if a value is likely encrypted based on its format
 * @param value The value to check
 * @returns True if the value appears to be encrypted
 */
export function isLikelyEncrypted(value: string): boolean {
  // Simple heuristic: encrypted values are base64 strings of significant length
  return Boolean(value && value.length > 20 && /^[A-Za-z0-9+/=]+$/.test(value));
}

/**
 * Batch processes an array of environment variables for encryption/decryption
 * @param variables The array of environment variables
 * @param userId The user ID for key derivation
 * @param operation 'encrypt' or 'decrypt'
 * @returns The processed array with encrypted/decrypted values
 */
export async function processEnvironmentVariables(
  variables: Array<{ id: string; key: string; value: string; enabled: boolean }>,
  userId: string,
  operation: 'encrypt' | 'decrypt'
): Promise<Array<{ id: string; key: string; value: string; enabled: boolean }>> {
  if (!userId || !variables.length) return variables;
  
  const processedVariables = [...variables];
  
  // Process each variable in sequence
  for (let i = 0; i < processedVariables.length; i++) {
    const variable = processedVariables[i];
    
    // Skip empty values
    if (!variable.value) continue;
    
    if (operation === 'encrypt') {
      // Don't re-encrypt values that appear to be already encrypted
      if (!isLikelyEncrypted(variable.value)) {
        processedVariables[i] = {
          ...variable,
          value: await encryptText(variable.value, userId)
        };
      }
    } else if (operation === 'decrypt') {
      // Only attempt to decrypt values that appear to be encrypted
      if (isLikelyEncrypted(variable.value)) {
        processedVariables[i] = {
          ...variable,
          value: await decryptText(variable.value, userId)
        };
      }
    }
  }
  
  return processedVariables;
} 