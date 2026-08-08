require('dotenv').config();
const db = require('../src/db/index');

async function runMigration() {
  try {
    console.log('Running migration for wallet_funding table...');

    // Check if table exists by trying to query it
    const result = await db.execute(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'wallet_funding'
      );
    `);
    
    console.log('Query result:', result);
    
    const tableExists = result[0]?.exists || false;
    
    if (tableExists) {
      console.log('Table wallet_funding already exists');
      
      // Check if it has the correct columns
      const columns = await db.execute(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'wallet_funding'
        ORDER BY ordinal_position;
      `);
      
      console.log('Existing columns:', columns.map(r => r.column_name));
      
      // If table exists but is missing columns, add them
      const existingColumns = columns.map(r => r.column_name);
      const requiredColumns = ['id', 'customer_id', 'amount', 'currency', 'provider', 'phone_number', 'transaction_id', 'status', 'reference', 'provider_response', 'completed_at', 'created_at', 'updated_at'];
      
      for (const col of requiredColumns) {
        if (!existingColumns.includes(col)) {
          console.log(`Adding missing column: ${col}`);
          await db.execute(`ALTER TABLE wallet_funding ADD COLUMN ${col} TEXT`);
        }
      }
    } else {
      console.log('Creating wallet_funding table');
      await db.execute(`
        CREATE TABLE wallet_funding (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          customer_id UUID NOT NULL REFERENCES customers(id),
          amount VARCHAR(50) NOT NULL,
          currency VARCHAR(10) DEFAULT 'SLE' NOT NULL,
          provider VARCHAR(50) NOT NULL,
          phone_number VARCHAR(20) NOT NULL,
          transaction_id VARCHAR(100),
          status VARCHAR(50) DEFAULT 'PENDING' NOT NULL,
          reference VARCHAR(100) NOT NULL,
          provider_response TEXT,
          completed_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);

      // Create indexes
      await db.execute(`CREATE INDEX IF NOT EXISTS wallet_funding_customer_id_idx ON wallet_funding(customer_id)`);
      await db.execute(`CREATE INDEX IF NOT EXISTS wallet_funding_status_idx ON wallet_funding(status)`);
      await db.execute(`CREATE INDEX IF NOT EXISTS wallet_funding_provider_idx ON wallet_funding(provider)`);
      await db.execute(`CREATE INDEX IF NOT EXISTS wallet_funding_created_at_idx ON wallet_funding(created_at)`);
      
      console.log('Table and indexes created successfully');
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
