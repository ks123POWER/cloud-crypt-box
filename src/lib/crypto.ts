// Real cryptography functions using Web Crypto API

export interface EncryptedFile {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  storagePath: string;
  fileHash: string;
  encryptionKey: string; // IV stored here
  createdAt: string;
  userId: string;
}

// Derive encryption key from master password using PBKDF2
const deriveKey = async (masterPassword: string, salt: Uint8Array): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(masterPassword);
  
  const importedKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256'
    },
    importedKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
};

// Encrypt file using AES-256-GCM with master password
export const encryptFile = async (
  file: File,
  masterPassword: string
): Promise<{ encryptedData: ArrayBuffer; iv: Uint8Array; hash: string }> => {
  const fileBuffer = await file.arrayBuffer();
  
  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Derive encryption key from master password
  const key = await deriveKey(masterPassword, salt);
  
  // Encrypt the file
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    fileBuffer
  );
  
  // Calculate SHA-256 hash of encrypted data
  const hashBuffer = await crypto.subtle.digest('SHA-256', encryptedData);
  const hash = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Combine salt + IV for storage
  const combinedIv = new Uint8Array(salt.length + iv.length);
  combinedIv.set(salt);
  combinedIv.set(iv, salt.length);
  
  return {
    encryptedData,
    iv: combinedIv,
    hash
  };
};

// Decrypt file using AES-256-GCM with master password
export const decryptFile = async (
  encryptedData: ArrayBuffer,
  ivData: string,
  masterPassword: string,
  fileName: string,
  fileType: string
): Promise<Blob> => {
  try {
    // Decode the combined salt + IV
    const combinedIv = Uint8Array.from(atob(ivData), c => c.charCodeAt(0));
    const salt = combinedIv.slice(0, 16);
    const iv = combinedIv.slice(16);
    
    // Derive the same encryption key
    const key = await deriveKey(masterPassword, salt);
    
    // Decrypt the data
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encryptedData
    );
    
    return new Blob([decryptedBuffer], { type: fileType });
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt file. Incorrect master password or corrupted file.');
  }
};

// Verify file integrity by comparing hashes
export const verifyFileIntegrity = async (
  encryptedData: ArrayBuffer,
  expectedHash: string
): Promise<boolean> => {
  try {
    const hashBuffer = await crypto.subtle.digest('SHA-256', encryptedData);
    const calculatedHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return calculatedHash === expectedHash;
  } catch (error) {
    console.error('Hash verification error:', error);
    return false;
  }
};

// Generate unique ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
