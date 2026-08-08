require('dotenv').config();
const db = require('../src/db/index');

async function runMigration() {
  try {
    console.log('Running migration for money_requests table...');

    // Check if table exists by trying to query it
    const result = await db.execute(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'money_requests'
      );
    `);
    
    console.log('Query result:', result);
    
    const tableExists = result[0]?.exists || false;
    
    if (tableExists) {
      console.log('Table money_requests already exists');
      
      // Check if it has the correct columns
      const columns = await db.execute(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'money_requests'
        ORDER BY ordinal_position;
      `);
      
      console.log('Existing columns:', columns.map(r => r.column_name));
      
      // If table exists but is missing columns, add them
      const existingColumns = columns.map(r => r.column_name);
      const requiredColumns = ['id', 'requester_id', 'receiver_id', 'amount', 'currency', 'description', 'status', 'expires_at', 'accepted_at', 'rejected_at', 'created_at', 'updated_at'];
      
      for (const col of requiredColumns) {
        if (!existingColumns.includes(col)) {
          console.log(`Adding missing column: ${col}`);
          await db.execute(`ALTER TABLE money_requests ADD COLUMN ${col} TEXT`);
        }
      }
    } else {
      console.log('Creating money_requests table');
      await db.execute(`
        CREATE TABLE money_requests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          requester_id UUID NOT NULL REFERENCES customers(id),
          receiver_id UUID NOT NULL REFERENCES customers(id),
          amount VARCHAR(50) NOT NULL,
          currency VARCHAR(10) DEFAULT 'SLE' NOT NULL,
          description TEXT,
          status VARCHAR(50) DEFAULT 'PENDING' NOT NULL,
          expires_at TIMESTAMP,
          accepted_at TIMESTAMP,
          rejected_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);

      // Create indexes
      await db.execute(`CREATE INDEX IF NOT EXISTS money_requests_requester_id_idx ON money_requests(requester_id)`);
      await db.execute(`CREATE INDEX IF NOT EXISTS money_requests_receiver_id_idx ON money_requests(receiver_id)`);
      await db.execute(`CREATE INDEX IF NOT EXISTS money_requests_status_idx ON money_requests(status)`);
      await db.execute(`CREATE INDEX IF NOT EXISTS money_requests_created_at_idx ON money_requests(created_at)`);
      
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
