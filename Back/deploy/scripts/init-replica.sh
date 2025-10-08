#!/usr/bin/env bash
set -euo pipefail

mongo_primary_host="${MONGO_PRIMARY_HOST:-mongo-primary}"
mongo_primary_port="${MONGO_PRIMARY_PORT:-27017}"
mongo_root_user="${MONGO_ROOT_USER:?MONGO_ROOT_USER required}"
mongo_root_password="${MONGO_ROOT_PASSWORD:?MONGO_ROOT_PASSWORD required}"

rs_status=$(mongosh --host "${mongo_primary_host}:${mongo_primary_port}" \
  -u "${mongo_root_user}" -p "${mongo_root_password}" --authenticationDatabase admin \
  --quiet --eval 'JSON.stringify(rs.status())' || true)

if [[ "${rs_status}" == *"no replset config has been received"* ]]; then
  cat <<'EOF' | mongosh --host "${mongo_primary_host}:${mongo_primary_port}" \
    -u "${mongo_root_user}" -p "${mongo_root_password}" --authenticationDatabase admin --quiet
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo-primary:27017" },
    { _id: 1, host: "mongo-secondary:27017" },
    { _id: 2, host: "mongo-arbiter:27017", arbiterOnly: true }
  ]
});
EOF
  echo "Replica set initiated"
else
  echo "Replica set already configured"
fi
