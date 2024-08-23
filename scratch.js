import { Client } from 'pg'

async function myInsert2(myTick, myTag, myHash, myEnum, myNote) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL, // Replace with your database URL
  });

  await client.connect();

  try {
    await client.query('BEGIN');
    
    const insert1Query = `
      INSERT INTO first_table (row_tick, row_tag, row_hash, row_enum, row_note)
      VALUES ($1, $2, $3, $4, $5);
    `;
    await client.query(insert1Query, [myTick, myTag, myHash, myEnum, myNote]);
    
    const insert2Query = `
      INSERT INTO second_table (row_tick, row_tag, row_hash, row_enum, row_note)
      VALUES ($1, $2, $3, $4, $5);
    `;
    await client.query(insert2Query, [myTick, myTag, myHash, myEnum, myNote]);
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

/*
import { Client } from 'pg'
// Helper function to escape text values
function postgresEscape(value) {
  // Use the pg module's escapeLiteral method for text escaping
  const client = new Client(); // Create a new Client instance just for this escape
  return client.escapeLiteral(value);
}
*/
test(() => {
  log('hi')
})
