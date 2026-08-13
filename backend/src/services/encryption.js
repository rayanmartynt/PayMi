const crypto = require('crypto');

// Generate a unique encryption key for a user using ECDH
function generateUserKey() {
  const ecdh = crypto.createECDH('secp256k1');
  ecdh.generateKeys();
  return {
    privateKey: ecdh.getPrivateKey('hex'),
    publicKey: ecdh.getPublicKey('hex')
  };
}

// Derive a shared key from two user keys using ECDH
function deriveSharedKey(privateKeyHex, publicKeyHex) {
  try {
    const ecdh = crypto.createECDH('secp256k1');
    ecdh.setPrivateKey(privateKeyHex, 'hex');
    const sharedKey = ecdh.computeSecret(publicKeyHex, 'hex');
    return sharedKey;
  } catch (error) {
    throw new Error('Failed to derive shared key: ' + error.message);
  }
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
