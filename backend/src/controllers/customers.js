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
    const user = userResult[0];

    // Flatten user verification fields into customer response
    customer.emailVerified = user.emailVerified;
    customer.phoneVerified = user.phoneVerified;
    customer.phoneNumber = user.phoneNumber;
    customer.email = user.email;
    customer.user = user;

    res.json(customer);
  } catch (error) {
    console.error('Get customer profile error:', error);
    res.status(500).json({ error: 'Failed to get customer profile' });
  }
};

const updateCustomerProfile = async (req, res) => {
  try {
    const { name, phone, address, email } = req.body;

    const customerResult = await db.update(customers)
      .set({ name, phone, address })
      .where(eq(customers.userId, req.user.id))
      .returning();
    
    const customer = customerResult[0];

    // Also update user name
    await db.update(users)
      .set({ name })
      .where(eq(users.id, req.user.id));

    // If user is adding an email for the first time
    if (email) {
      const userResult = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
      const user = userResult[0];
      
      if (!user.email) {
        // Check if email is already taken by another user
        const existingEmailResult = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (existingEmailResult[0]) {
          return res.status(400).json({ error: 'Email already registered to another account' });
        }
        
        await db.update(users)
          .set({ email, emailVerified: false })
          .where(eq(users.id, req.user.id));
      } else if (user.email !== email) {
        // User is changing their email
        const existingEmailResult = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (existingEmailResult[0]) {
          return res.status(400).json({ error: 'Email already registered to another account' });
        }
        
        await db.update(users)
          .set({ email, emailVerified: false })
          .where(eq(users.id, req.user.id));
      }
    }

    const updatedUserResult = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
    customer.user = updatedUserResult[0];

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

const deleteCustomerProfilePicture = async (req, res) => {
  try {
    const customerResult = await db.update(customers)
      .set({ profilePicture: null })
      .where(eq(customers.userId, req.user.id))
      .returning();

    const customer = customerResult[0];

    const userResult = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
    customer.user = userResult[0];

    res.json({
      message: 'Profile picture deleted successfully',
      customer
    });
  } catch (error) {
    console.error('Delete customer profile picture error:', error);
    res.status(500).json({ error: 'Failed to delete profile picture' });
  }
};

module.exports = {
  getCustomerProfile,
  updateCustomerProfile,
  uploadCustomerProfilePicture,
  deleteCustomerProfilePicture
};
