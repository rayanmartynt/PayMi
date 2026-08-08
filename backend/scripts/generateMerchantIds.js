require('dotenv').config();
const db = require('../src/db/index');
const { merchants } = require('../src/db/schema');
const { eq, isNull } = require('drizzle-orm');

// Generate unique 6-character alphanumeric merchant ID
function generateMerchantId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Check if merchant ID is unique
async function isMerchantIdUnique(merchantId) {
  const existing = await db.select().from(merchants).where(eq(merchants.merchantId, merchantId)).limit(1);
  return existing.length === 0;
}

// Generate a unique merchant ID
async function generateUniqueMerchantId() {
  let merchantId;
  let isUnique = false;
  let attempts = 0;
  
  while (!isUnique && attempts < 100) {
    merchantId = generateMerchantId();
    isUnique = await isMerchantIdUnique(merchantId);
    attempts++;
  }
  
  if (!isUnique) {
    throw new Error('Failed to generate unique merchant ID after 100 attempts');
  }
  
  return merchantId;
}

async function generateMerchantIds() {
  try {
    console.log('Starting merchant ID generation...');
    
    // Get all merchants
    const allMerchants = await db.select().from(merchants);
    
    // Filter merchants without merchant IDs
    const merchantsWithoutId = allMerchants.filter(m => !m.merchantId || m.merchantId === '');
    
    console.log(`Found ${merchantsWithoutId.length} merchants without IDs`);
    
    for (const merchant of merchantsWithoutId) {
      const merchantId = await generateUniqueMerchantId();
      
      await db.update(merchants)
        .set({ merchantId })
        .where(eq(merchants.id, merchant.id));
      
      console.log(`Generated ID ${merchantId} for merchant ${merchant.businessName}`);
    }
    
    console.log('Merchant ID generation completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error generating merchant IDs:', error);
    process.exit(1);
  }
}

generateMerchantIds();
