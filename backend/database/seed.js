require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/db');

async function seed() {
  const password = 'Admin1234!';
  const hash = await bcrypt.hash(password, 12);

  await pool.execute(
    'UPDATE usuarios SET password = ? WHERE username = ?',
    [hash, 'admin']
  );

  console.log('✔  Password del admin actualizado correctamente');
  console.log('   Usuario:    admin');
  console.log('   Contraseña: Admin1234!');
  process.exit(0);
}

seed().catch(err => {
  console.error('✖  Error:', err.message);
  process.exit(1);
});
