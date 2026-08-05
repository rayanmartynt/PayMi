const prisma = require('../lib/prisma');

const getCustomerProfile = async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { userId: req.user.id },
      include: {
        user: true
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Get customer profile error:', error);
    res.status(500).json({ error: 'Failed to get customer profile' });
  }
};

const updateCustomerProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    const customer = await prisma.customer.update({
      where: { userId: req.user.id },
      data: {
        name,
        phone,
        address
      },
      include: {
        user: true
      }
    });

    // Also update user name
    await prisma.user.update({
      where: { id: req.user.id },
      data: { name }
    });

    res.json(customer);
  } catch (error) {
    console.error('Update customer profile error:', error);
    res.status(500).json({ error: 'Failed to update customer profile' });
  }
};

const uploadCustomerProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const profilePictureUrl = `/uploads/${req.file.filename}`;

    const customer = await prisma.customer.update({
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
      customer
    });
  } catch (error) {
    console.error('Upload customer profile picture error:', error);
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
};

module.exports = {
  getCustomerProfile,
  updateCustomerProfile,
  uploadCustomerProfilePicture
};
