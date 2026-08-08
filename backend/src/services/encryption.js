const crypto = require('crypto');

// Generate a unique encryption key for a user
function generateUserKey() {
  return crypto.randomBytes(32).toString('hex');
}

// Derive a shared key from two user keys (for end-to-end encryption)
function deriveSharedKey(userKey1, userKey2) {
  // Simple XOR-based key derivation (in production, use proper ECDH)
  const key1 = Buffer.from(userKey1, 'hex');
  const key2 = Buffer.from(userKey2, 'hex');
  const sharedKey = Buffer.alloc(32);
  
  for (let i = 0; i < 32; i++) {
    sharedKey[i] = key1[i] ^ key2[i];
  }
  
  return sharedKey.toString('hex');
}

// Encrypt message with shared key
function encryptMessage(text, sharedKey) {
  const key = Buffer.from(sharedKey, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    encryptedContent: encrypted,
    iv: iv.toString('hex')
  };
}

// Decrypt message with shared key
function decryptMessage(encryptedContent, ivHex, sharedKey) {
  const key = Buffer.from(sharedKey, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  
  let decrypted = decipher.update(encryptedContent, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

module.exports = {
  generateUserKey,
  deriveSharedKey,
  encryptMessage,
  decryptMessage
};
