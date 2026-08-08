require('dotenv').config();
const db = require('../src/db/index');

async function runMigration() {
  try {
    console.log('Running migration for admin fee management...');

    // Add adminBalance column to users table
    const usersColumnCheck = await db.execute(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'admin_balance'
      );
    `);
    
    if (!usersColumnCheck[0]?.exists) {
      console.log('Adding admin_balance column to users table');
      await db.execute(`ALTER TABLE users ADD COLUMN admin_balance DECIMAL(15,2) DEFAULT 0 NOT NULL`);
    } else {
      console.log('admin_balance column already exists in users table');
    }

    // Add isCollected and collectedAt columns to admin_fees table
    const isCollectedCheck = await db.execute(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'admin_fees' AND column_name = 'is_collected'
      );
    `);
    
    if (!isCollectedCheck[0]?.exists) {
      console.log('Adding is_collected column to admin_fees table');
      await db.execute(`ALTER TABLE admin_fees ADD COLUMN is_collected BOOLEAN DEFAULT false NOT NULL`);
    } else {
      console.log('is_collected column already exists in admin_fees table');
    }

    const collectedAtCheck = await db.execute(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'admin_fees' AND column_name = 'collected_at'
      );
    `);
    
    if (!collectedAtCheck[0]?.exists) {
      console.log('Adding collected_at column to admin_fees table');
      await db.execute(`ALTER TABLE admin_fees ADD COLUMN collected_at TIMESTAMP`);
    } else {
      console.log('collected_at column already exists in admin_fees table');
    }

    // Create admin_bank_accounts table
    const bankAccountsCheck = await db.execute(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'admin_bank_accounts'
      );
    `);
    
    if (!bankAccountsCheck[0]?.exists) {
      console.log('Creating admin_bank_accounts table');
      await db.execute(`
        CREATE TABLE admin_bank_accounts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id),
          bank_name VARCHAR(255) NOT NULL,
          account_number VARCHAR(50) NOT NULL,
          account_name VARCHAR(255) NOT NULL,
          is_default BOOLEAN DEFAULT false NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);
      await db.execute(`CREATE INDEX IF NOT EXISTS admin_bank_accounts_user_id_idx ON admin_bank_accounts(user_id)`);
    } else {
      console.log('admin_bank_accounts table already exists');
    }

    // Create admin_withdrawals table
    const withdrawalsCheck = await db.execute(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'admin_withdrawals'
      );
    `);
    
    if (!withdrawalsCheck[0]?.exists) {
      console.log('Creating admin_withdrawals table');
      await db.execute(`
        CREATE TABLE admin_withdrawals (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id),
          amount DECIMAL(15,2) NOT NULL,
          currency VARCHAR(10) DEFAULT 'SLE' NOT NULL,
          bank_account_id UUID REFERENCES admin_bank_accounts(id),
          status VARCHAR(50) DEFAULT 'PENDING' NOT NULL,
          reference VARCHAR(100) NOT NULL,
          processed_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);
      await db.execute(`CREATE INDEX IF NOT EXISTS admin_withdrawals_user_id_idx ON admin_withdrawals(user_id)`);
      await db.execute(`CREATE INDEX IF NOT EXISTS admin_withdrawals_status_idx ON admin_withdrawals(status)`);
      await db.execute(`CREATE INDEX IF NOT EXISTS admin_withdrawals_created_at_idx ON admin_withdrawals(created_at)`);
    } else {
      console.log('admin_withdrawals table already exists');
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
