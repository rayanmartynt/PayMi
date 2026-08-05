const prisma = require('../lib/prisma');

const getMerchantProfile = async (req, res) => {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { userId: req.user.id },
      include: {
        user: true
      }
    });

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    res.json(merchant);
  } catch (error) {
    console.error('Get merchant profile error:', error);
    res.status(500).json({ error: 'Failed to get merchant profile' });
  }
};

const updateMerchantProfile = async (req, res) => {
  try {
    const { businessName, businessType, businessEmail, phoneNumber, businessAddress } = req.body;

    const merchant = await prisma.merchant.update({
      where: { userId: req.user.id },
      data: {
        businessName,
        businessType,
        businessEmail,
        phoneNumber,
        businessAddress
      },
      include: {
        user: true
      }
    });

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

    const merchant = await prisma.merchant.update({
      where: { userId: req.user.id },
      data: {
        profilePicture: profilePictureUrl
      },
      include: {
        user: true
      }
    });

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
