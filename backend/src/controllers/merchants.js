const db = require('../db/index');
const { eq } = require('drizzle-orm');
const { merchants, users } = require('../db/schema');

const getMerchantProfile = async (req, res) => {
  try {
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const userResult = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
    merchant.user = userResult[0];

    res.json(merchant);
  } catch (error) {
    console.error('Get merchant profile error:', error);
    res.status(500).json({ error: 'Failed to get merchant profile' });
  }
};

const updateMerchantProfile = async (req, res) => {
  try {
    const { businessName, businessType, businessEmail, phoneNumber, businessAddress } = req.body;

    const merchantResult = await db.update(merchants)
      .set({ businessName, businessType, businessEmail, phoneNumber, businessAddress })
      .where(eq(merchants.userId, req.user.id))
      .returning();
    
    const merchant = merchantResult[0];

    const userResult = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
    merchant.user = userResult[0];

    res.json(merchant);
  } catch (error) {
    console.error('Update merchant profile error:', error);
    res.status(500).json({ error: 'Failed to update merchant profile' });
  }
};

const uploadMerchantProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const profilePictureUrl = `/uploads/${req.file.filename}`;

    const merchantResult = await db.update(merchants)
      .set({ profilePicture: profilePictureUrl })
      .where(eq(merchants.userId, req.user.id))
      .returning();
    
    const merchant = merchantResult[0];

    const userResult = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
    merchant.user = userResult[0];

    res.json({
      message: 'Profile picture uploaded successfully',
      profilePicture: profilePictureUrl,
      merchant
    });
  } catch (error) {
    console.error('Upload merchant profile picture error:', error);
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
};

module.exports = {
  getMerchantProfile,
  updateMerchantProfile,
  uploadMerchantProfilePicture
};
