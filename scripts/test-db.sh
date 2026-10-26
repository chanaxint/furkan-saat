#!/usr/bin/env sh
# Runs the database migrations and the RLS tests on a throwaway local
# PostgreSQL database (PostgreSQL 15+). Connection from the usual PG* variables.
#   PGHOST=/tmp PGPORT=5432 PGUSER=postgres sh scripts/test-db.sh
# Each test file gets a fresh database. Finally the rollback files are applied
# and the customer tests run again, to show the way back leaves them intact.
set -eu
DB=furkan_saat_rls_test
cd "$(dirname "$0")/.."
run() { psql -X -q -v ON_ERROR_STOP=1 -o /dev/null -d "$DB" -f "$1"; }
fresh() {
  dropdb --if-exists "$DB" >/dev/null
  createdb "$DB"
  run supabase/tests/00_supabase_stub.sql
  for f in supabase/migrations/*.sql; do run "$f"; done
  run supabase/seed/products.sql
}

for t in supabase/tests/*.test.sql; do
  echo "== $t"
  fresh
  run "$t"
done

echo "== catalog-verify on the seeded database"
fresh
ROWS="$(mktemp)"
export_rows() {
  psql -X -q -A -t -v ON_ERROR_STOP=1 -d "$DB" -o "$ROWS" -c \
    "select coalesce(json_agg(p order by position, slug), '[]') from (select $(node -e 'import("./src/lib/catalog/rows.ts").then(m => console.log(m.PRODUCT_COLUMNS.join(",")))' 2>/dev/null) from public.products) p"
}
export_rows
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/catalog-verify.mjs --rows "$ROWS"
# A changed price must be caught.
psql -X -q -v ON_ERROR_STOP=1 -o /dev/null -d "$DB" -c "update public.products set price = price + 1 where slug = 'casio-edifice-efb-730d-3av'"
export_rows
if node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/catalog-verify.mjs --rows "$ROWS" >/dev/null; then
  echo "FAIL: catalog-verify did not notice a changed price"; rm -f "$ROWS"; exit 1
fi
echo "ok  catalog-verify notices a changed price"
rm -f "$ROWS"

echo "== rollback, then supabase/tests/01_rls.test.sql"
fresh
for f in $(ls -r supabase/rollback/*.down.sql); do run "$f"; done
run supabase/tests/01_rls.test.sql

dropdb "$DB"
