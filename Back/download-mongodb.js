const { MongoMemoryServer } = require('mongodb-memory-server');

console.log('Downloading MongoDB binaries...');

MongoMemoryServer.create()
  .then((mongod) => {
    console.log('MongoDB binaries downloaded successfully!');
    return mongod.stop();
  })
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error downloading MongoDB binaries:', err);
    process.exit(1);
  });
