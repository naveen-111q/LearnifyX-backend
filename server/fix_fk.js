const pool = require('./db');
pool.execute("ALTER TABLE answers DROP FOREIGN KEY answers_ibfk_2")
  .then(() => { console.log('Dropped foreign key successfully'); process.exit(0); })
  .catch(err => { console.error('Error dropping foreign key:', err); process.exit(1); });
