const pool = require('./db');
pool.execute("SHOW CREATE TABLE answers")
  .then(([res]) => { console.log(res[0]['Create Table']); process.exit(0); })
  .catch(err => { console.error(err); process.exit(1); });
