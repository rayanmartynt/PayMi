const db = require('../db/index');
const { eq } = require('drizzle-orm');
const { customers, users } = require('../db/schema');

const getCustomerProfile = async (req, res) => {
  try {
    const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
    const customer = customerResult[0];

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const userResult = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
    customer.user = userResult[0];

    res.json(customer);
  } catch (error) {
    console.error('Get customer profile error:', error);
    res.status(500).json({ error: 'Failed to get customer profile' });
  }
};

const updateCustomerProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    const customerResult = await db.update(customers)
      .set({ name, phone, address })
      .where(eq(customers.userId, req.user.id))
      .returning();
    
    const customer = customerResult[0];

    // Also update user name
    await db.update(users)
      .set({ name })
      .where(eq(users.id, req.user.id));

    const userResult = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
    customer.user = userResult[0];

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

    const customerResult = await db.update(customers)
      .set({ profilePicture: profilePictureUrl })
      .where(eq(customers.userId, req.user.id))
      .returning();
    
    const customer = customerResult[0];

    const userResult = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
    customer.user = userResult[0];

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
