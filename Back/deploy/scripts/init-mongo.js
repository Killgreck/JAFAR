// Creates application users for replica set when the primary container starts.
// Mongo will execute this script automatically if mounted in /docker-entrypoint-initdb.d

db = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE || 'jafar');

const appUser = process.env.MONGO_APP_USER || 'app_user';
const appPassword = process.env.MONGO_APP_PASSWORD || 'change_me_app';

const ledgerUser = process.env.MONGO_LEDGER_USER || 'ledger_user';
const ledgerPassword = process.env.MONGO_LEDGER_PASSWORD || 'change_me_ledger';

if (!db.getUser(appUser)) {
  db.createUser({
    user: appUser,
    pwd: appPassword,
    roles: [
      { role: 'readWrite', db: db.getName() },
      { role: 'read', db: 'admin' }
    ]
  });
}

if (!db.getUser(ledgerUser)) {
  db.createUser({
    user: ledgerUser,
    pwd: ledgerPassword,
    roles: [
      { role: 'read', db: db.getName() },
      { role: 'readWrite', db: 'ledger' }
    ]
  });
}
