// Script to run all database migrations
const { exec } = require('child_process');
const path = require('path');

const migrations = [
  'updateMediaDuration.js',
  'updatePostFields.js'
];

const runMigration = (migrationFile) => {
  return new Promise((resolve, reject) => {
    const migrationPath = path.join(__dirname, migrationFile);
    console.log(`Running migration: ${migrationFile}`);
    
    exec(`node "${migrationPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error running ${migrationFile}:`, error);
        reject(error);
      } else {
        console.log(`Migration ${migrationFile} completed successfully`);
        console.log(stdout);
        resolve();
      }
    });
  });
};

const runAllMigrations = async () => {
  console.log('Starting all migrations...');
  
  try {
    for (const migration of migrations) {
      await runMigration(migration);
    }
    
    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

// Run migrations if this script is executed directly
if (require.main === module) {
  runAllMigrations();
}

module.exports = { runAllMigrations };