#!/usr/bin/env bash
set -euo pipefail

# Inserts a larger demo dataset through the Spring Boot REST API.
#
# Usage:
#   scripts/admin/insert-demo-data.sh
#
# Optional environment:
#   API_BASE_URL=http://localhost:8082
#   DEMO_PASSWORD=demo

API_BASE_URL="${API_BASE_URL:-http://localhost:8082}"
DEMO_PASSWORD="${DEMO_PASSWORD:-demo}"
COMPANY_BASE_PRICE_PER_KG="2.40"
COMPANY_ADDRESS_SURCHARGE="6.50"

API_COMPANY="${API_BASE_URL}/api/company"
API_OFFICE="${API_BASE_URL}/api/office"
API_USER="${API_BASE_URL}/api/user"
API_CLIENT="${API_BASE_URL}/api/client"
API_EMPLOYEE="${API_BASE_URL}/api/employee"
API_SHIPMENT="${API_BASE_URL}/api/shipment"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

json_id() {
  python3 -c 'import json, sys; print(json.load(sys.stdin)["id"])'
}

post_json() {
  local url="$1"
  local payload="$2"
  local response_file
  response_file="$(mktemp)"
  local status
  status="$(curl -sS \
    -o "$response_file" \
    -w "%{http_code}" \
    -X POST "$url" \
    -H "Content-Type: application/json" \
    -d "$payload")"
  if [ "$status" -lt 200 ] || [ "$status" -ge 300 ]; then
    echo "POST ${url} failed with HTTP ${status}" >&2
    echo "Payload:" >&2
    echo "$payload" >&2
    echo "Response:" >&2
    cat "$response_file" >&2
    echo >&2
    rm -f "$response_file"
    exit 1
  fi
  cat "$response_file"
  rm -f "$response_file"
}

put_empty() {
  local url="$1"
  local response_file
  response_file="$(mktemp)"
  local status
  status="$(curl -sS -o "$response_file" -w "%{http_code}" -X PUT "$url")"
  if [ "$status" -lt 200 ] || [ "$status" -ge 300 ]; then
    echo "PUT ${url} failed with HTTP ${status}" >&2
    echo "Response:" >&2
    cat "$response_file" >&2
    echo >&2
    rm -f "$response_file"
    exit 1
  fi
  rm -f "$response_file"
}

create_company() {
  local name="$1"
  local base_price="$2"
  local address_surcharge="$3"

  post_json "$API_COMPANY" "{
    \"name\": \"${name}\",
    \"basePricePerKg\": ${base_price},
    \"addressSurcharge\": ${address_surcharge}
  }" | json_id
}

create_office() {
  local company_id="$1"
  local city="$2"
  local address="$3"
  local phone="$4"

  post_json "$API_OFFICE" "{
    \"company\": { \"id\": ${company_id} },
    \"city\": \"${city}\",
    \"address\": \"${address}\",
    \"phone\": \"${phone}\"
  }" | json_id
}

create_user() {
  local username="$1"
  local email="$2"
  local role="$3"
  local first_name="${4:-}"
  local last_name="${5:-}"

  post_json "$API_USER" "{
    \"username\": \"${username}\",
    \"passwordHash\": \"${DEMO_PASSWORD}\",
    \"email\": \"${email}\",
    \"firstName\": \"${first_name}\",
    \"lastName\": \"${last_name}\",
    \"role\": \"${role}\"
  }" | json_id
}

create_client() {
  local user_id="$1"
  local phone="$2"

  post_json "$API_CLIENT" "{
    \"user\": { \"id\": ${user_id} },
    \"phone\": \"${phone}\"
  }" | json_id
}

create_employee() {
  local user_id="$1"
  local company_id="$2"
  local office_id="$3"
  local employee_type="$4"

  post_json "$API_EMPLOYEE" "{
    \"user\": { \"id\": ${user_id} },
    \"company\": { \"id\": ${company_id} },
    \"office\": { \"id\": ${office_id} },
    \"employeeType\": \"${employee_type}\"
  }" | json_id
}

create_shipment() {
  local company_id="$1"
  local sender_id="$2"
  local recipient_id="$3"
  local employee_id="$4"
  local delivery_type="$5"
  local destination_office_id="$6"
  local weight="$7"
  local delivery_address="${8:-}"
  local company_json
  company_json="{ \"id\": ${company_id}, \"basePricePerKg\": ${COMPANY_BASE_PRICE_PER_KG}, \"addressSurcharge\": ${COMPANY_ADDRESS_SURCHARGE} }"

  if [ "$delivery_type" = "TO_ADDRESS" ]; then
    post_json "$API_SHIPMENT" "{
      \"company\": ${company_json},
      \"sender\": { \"id\": ${sender_id} },
      \"recipient\": { \"id\": ${recipient_id} },
      \"registeredBy\": { \"id\": ${employee_id} },
      \"deliveryType\": \"TO_ADDRESS\",
      \"deliveryAddress\": \"${delivery_address}\",
      \"weight\": ${weight}
    }" | json_id
  else
    post_json "$API_SHIPMENT" "{
      \"company\": ${company_json},
      \"sender\": { \"id\": ${sender_id} },
      \"recipient\": { \"id\": ${recipient_id} },
      \"registeredBy\": { \"id\": ${employee_id} },
      \"deliveryType\": \"TO_OFFICE\",
      \"destinationOffice\": { \"id\": ${destination_office_id} },
      \"weight\": ${weight}
    }" | json_id
  fi
}

mark_in_transit() { put_empty "${API_SHIPMENT}/${1}/transit"; }
mark_delivered()   { put_empty "${API_SHIPMENT}/${1}/deliver"; }
mark_cancelled()   { put_empty "${API_SHIPMENT}/${1}/cancel"; }

print_id() { printf "  %-34s %s\n" "$1" "$2"; }

require_command curl
require_command python3

echo "Inserting demo data into ${API_BASE_URL}"
echo "All demo users use password: ${DEMO_PASSWORD}"
echo

# ── Company ────────────────────────────────────────────────────────────────────
echo "Creating company..."
COMPANY_ID="$(create_company "Dkont Logistics" "$COMPANY_BASE_PRICE_PER_KG" "$COMPANY_ADDRESS_SURCHARGE")"
print_id "company:Dkont Logistics" "$COMPANY_ID"
echo

# ── Offices ────────────────────────────────────────────────────────────────────
echo "Creating offices..."
SOFIA_ID="$(create_office   "$COMPANY_ID" "София"         "ул. Шипка 12"              "+359 2 700 1000")"
PLOVDIV_ID="$(create_office "$COMPANY_ID" "Пловдив"       "бул. Марица 44"            "+359 32 700 200")"
VARNA_ID="$(create_office   "$COMPANY_ID" "Варна"         "бул. Приморски 8"          "+359 52 700 300")"
BURGAS_ID="$(create_office  "$COMPANY_ID" "Бургас"        "ул. Транспортна 31"        "+359 56 700 400")"
RUSE_ID="$(create_office    "$COMPANY_ID" "Русе"          "пл. Дунав 9"               "+359 82 700 500")"
THESS_ID="$(create_office   "$COMPANY_ID" "Thessaloniki"  "Tsimiski 26"               "+30 231 070 0100")"
LONDON_ID="$(create_office  "$COMPANY_ID" "London"        "14 Cannon Street"          "+44 20 7000 1000")"
print_id "office:София"        "$SOFIA_ID"
print_id "office:Пловдив"      "$PLOVDIV_ID"
print_id "office:Варна"        "$VARNA_ID"
print_id "office:Бургас"       "$BURGAS_ID"
print_id "office:Русе"         "$RUSE_ID"
print_id "office:Thessaloniki" "$THESS_ID"
print_id "office:London"       "$LONDON_ID"
echo

# ── Admin ──────────────────────────────────────────────────────────────────────
echo "Creating admin user..."
ADMIN_ID="$(post_json "$API_USER" "{
  \"username\": \"admin\",
  \"passwordHash\": \"admin\",
  \"email\": \"admin@dkont.test\",
  \"firstName\": \"Администратор\",
  \"lastName\": \"Системен\",
  \"role\": \"ADMIN\"
}" | json_id)"
print_id "user:admin" "$ADMIN_ID"
echo

# ── Employee users ─────────────────────────────────────────────────────────────
echo "Creating employee users..."
# Bulgarian office workers
ELENA_U="$(create_user    "elena.office"   "elena.ivanova@dkont.test"      "EMPLOYEE" "Елена"      "Иванова")"
GEORGI_U="$(create_user   "georgi.office"  "georgi.petrov@dkont.test"      "EMPLOYEE" "Георги"     "Петров")"
# Greek office worker
ANDREAS_U="$(create_user  "andreas.office" "andreas.p@dkont.test"          "EMPLOYEE" "Ανδρέας"    "Παπαδόπουλος")"
# English office worker
JAMES_U="$(create_user    "james.office"   "james.smith@dkont.test"        "EMPLOYEE" "James"      "Smith")"
# Bulgarian couriers
NIKOLAY_U="$(create_user  "nikolay.c"      "nikolay.dimitrov@dkont.test"   "EMPLOYEE" "Николай"    "Димитров")"
PETAR_U="$(create_user    "petar.c"        "petar.stoychev@dkont.test"     "EMPLOYEE" "Петър"      "Стойчев")"
VIKTOR_U="$(create_user   "viktor.c"       "viktor.hristov@dkont.test"     "EMPLOYEE" "Виктор"     "Христов")"
# Greek courier
KOSTAS_U="$(create_user   "kostas.c"       "kostas.n@dkont.test"           "EMPLOYEE" "Κώστας"     "Νικολάου")"
# English courier
OLIVER_U="$(create_user   "oliver.c"       "oliver.brown@dkont.test"       "EMPLOYEE" "Oliver"     "Brown")"
print_id "user:elena.office"   "$ELENA_U"
print_id "user:georgi.office"  "$GEORGI_U"
print_id "user:andreas.office" "$ANDREAS_U"
print_id "user:james.office"   "$JAMES_U"
print_id "user:nikolay.c"      "$NIKOLAY_U"
print_id "user:petar.c"        "$PETAR_U"
print_id "user:viktor.c"       "$VIKTOR_U"
print_id "user:kostas.c"       "$KOSTAS_U"
print_id "user:oliver.c"       "$OLIVER_U"
echo

# ── Employees ──────────────────────────────────────────────────────────────────
echo "Creating employees..."
ELENA_E="$(create_employee   "$ELENA_U"   "$COMPANY_ID" "$SOFIA_ID"    "OFFICE_EMPLOYEE")"
GEORGI_E="$(create_employee  "$GEORGI_U"  "$COMPANY_ID" "$PLOVDIV_ID"  "OFFICE_EMPLOYEE")"
ANDREAS_E="$(create_employee "$ANDREAS_U" "$COMPANY_ID" "$THESS_ID"    "OFFICE_EMPLOYEE")"
JAMES_E="$(create_employee   "$JAMES_U"   "$COMPANY_ID" "$LONDON_ID"   "OFFICE_EMPLOYEE")"
NIKOLAY_E="$(create_employee "$NIKOLAY_U" "$COMPANY_ID" "$SOFIA_ID"    "COURIER")"
PETAR_E="$(create_employee   "$PETAR_U"   "$COMPANY_ID" "$VARNA_ID"    "COURIER")"
VIKTOR_E="$(create_employee  "$VIKTOR_U"  "$COMPANY_ID" "$BURGAS_ID"   "COURIER")"
KOSTAS_E="$(create_employee  "$KOSTAS_U"  "$COMPANY_ID" "$THESS_ID"    "COURIER")"
OLIVER_E="$(create_employee  "$OLIVER_U"  "$COMPANY_ID" "$LONDON_ID"   "COURIER")"
print_id "employee:Елена Иванова"         "$ELENA_E"
print_id "employee:Георги Петров"         "$GEORGI_E"
print_id "employee:Ανδρέας Παπαδόπουλος" "$ANDREAS_E"
print_id "employee:James Smith"           "$JAMES_E"
print_id "employee:Николай Димитров"      "$NIKOLAY_E"
print_id "employee:Петър Стойчев"         "$PETAR_E"
print_id "employee:Виктор Христов"        "$VIKTOR_E"
print_id "employee:Κώστας Νικολάου"       "$KOSTAS_E"
print_id "employee:Oliver Brown"          "$OLIVER_E"
echo

# ── Client users ───────────────────────────────────────────────────────────────
echo "Creating client users..."
# Bulgarian clients
MARIA_U="$(create_user    "maria.c"    "maria.georgieva@mail.test"     "CLIENT" "Мария"       "Георгиева")"
IVAN_U="$(create_user     "ivan.c"     "ivan.kolev@mail.test"          "CLIENT" "Иван"        "Колев")"
ANNA_U="$(create_user     "anna.c"     "anna.todorova@mail.test"       "CLIENT" "Анна"        "Тодорова")"
STOYAN_U="$(create_user   "stoyan.c"   "stoyan.nikolov@mail.test"      "CLIENT" "Стоян"       "Николов")"
BORIS_U="$(create_user    "boris.c"    "boris.marinov@mail.test"       "CLIENT" "Борис"       "Маринов")"
KALINA_U="$(create_user   "kalina.c"   "kalina.stoyanova@mail.test"    "CLIENT" "Калина"      "Стоянова")"
# Greek clients
ALEX_U="$(create_user     "alex.c"     "alex.nikolaou@mail.test"       "CLIENT" "Αλέξανδρος"  "Νικολάου")"
SOFIA_U="$(create_user    "sofia.gr.c" "sofia.k@mail.test"             "CLIENT" "Σοφία"       "Κωνσταντίνου")"
# English clients
SARAH_U="$(create_user    "sarah.c"    "sarah.johnson@mail.test"       "CLIENT" "Sarah"       "Johnson")"
MICHAEL_U="$(create_user  "michael.c"  "michael.brown@mail.test"       "CLIENT" "Michael"     "Brown")"
print_id "user:Мария Георгиева"         "$MARIA_U"
print_id "user:Иван Колев"              "$IVAN_U"
print_id "user:Анна Тодорова"           "$ANNA_U"
print_id "user:Стоян Николов"           "$STOYAN_U"
print_id "user:Борис Маринов"           "$BORIS_U"
print_id "user:Калина Стоянова"         "$KALINA_U"
print_id "user:Αλέξανδρος Νικολάου"    "$ALEX_U"
print_id "user:Σοφία Κωνσταντίνου"     "$SOFIA_U"
print_id "user:Sarah Johnson"           "$SARAH_U"
print_id "user:Michael Brown"           "$MICHAEL_U"
echo

# ── Clients ────────────────────────────────────────────────────────────────────
echo "Creating clients..."
MARIA_C="$(create_client   "$MARIA_U"   "+359 878 100 201")"
IVAN_C="$(create_client    "$IVAN_U"    "+359 877 100 202")"
ANNA_C="$(create_client    "$ANNA_U"    "+359 879 100 203")"
STOYAN_C="$(create_client  "$STOYAN_U"  "+359 878 100 204")"
BORIS_C="$(create_client   "$BORIS_U"   "+359 877 100 205")"
KALINA_C="$(create_client  "$KALINA_U"  "+359 879 100 206")"
ALEX_C="$(create_client    "$ALEX_U"    "+30 694 100 0301")"
SOFIA_C="$(create_client   "$SOFIA_U"   "+30 693 100 0302")"
SARAH_C="$(create_client   "$SARAH_U"   "+44 7700 900 401")"
MICHAEL_C="$(create_client "$MICHAEL_U" "+44 7700 900 402")"
print_id "client:Мария"       "$MARIA_C"
print_id "client:Иван"        "$IVAN_C"
print_id "client:Анна"        "$ANNA_C"
print_id "client:Стоян"       "$STOYAN_C"
print_id "client:Борис"       "$BORIS_C"
print_id "client:Калина"      "$KALINA_C"
print_id "client:Αλέξανδρος" "$ALEX_C"
print_id "client:Σοφία"       "$SOFIA_C"
print_id "client:Sarah"       "$SARAH_C"
print_id "client:Michael"     "$MICHAEL_C"
echo

# ── Shipments ──────────────────────────────────────────────────────────────────
echo "Creating shipments..."
S1="$(create_shipment  "$COMPANY_ID" "$MARIA_C"   "$IVAN_C"    "$ELENA_E"   "TO_OFFICE"  "$PLOVDIV_ID" "2.500")"
S2="$(create_shipment  "$COMPANY_ID" "$IVAN_C"    "$ANNA_C"    "$GEORGI_E"  "TO_ADDRESS" "$SOFIA_ID"   "1.200" "София, бул. Витоша 18, ет. 3")"
S3="$(create_shipment  "$COMPANY_ID" "$ANNA_C"    "$STOYAN_C"  "$ELENA_E"   "TO_OFFICE"  "$VARNA_ID"   "7.750")"
S4="$(create_shipment  "$COMPANY_ID" "$STOYAN_C"  "$BORIS_C"   "$GEORGI_E"  "TO_ADDRESS" "$PLOVDIV_ID" "4.000" "Пловдив, ул. Капана 5")"
S5="$(create_shipment  "$COMPANY_ID" "$BORIS_C"   "$KALINA_C"  "$ELENA_E"   "TO_OFFICE"  "$BURGAS_ID"  "0.850")"
S6="$(create_shipment  "$COMPANY_ID" "$KALINA_C"  "$MARIA_C"   "$GEORGI_E"  "TO_OFFICE"  "$RUSE_ID"    "12.300")"
S7="$(create_shipment  "$COMPANY_ID" "$ALEX_C"    "$SOFIA_C"   "$ANDREAS_E" "TO_OFFICE"  "$THESS_ID"   "3.200")"
S8="$(create_shipment  "$COMPANY_ID" "$SOFIA_C"   "$SARAH_C"   "$ANDREAS_E" "TO_ADDRESS" "$THESS_ID"   "1.800" "14 Cannon Street, London")"
S9="$(create_shipment  "$COMPANY_ID" "$SARAH_C"   "$MICHAEL_C" "$JAMES_E"   "TO_OFFICE"  "$LONDON_ID"  "5.500")"
S10="$(create_shipment "$COMPANY_ID" "$MICHAEL_C" "$IVAN_C"    "$JAMES_E"   "TO_ADDRESS" "$SOFIA_ID"   "2.100" "София, ул. Раковски 99")"
S11="$(create_shipment "$COMPANY_ID" "$MARIA_C"   "$SARAH_C"   "$ELENA_E"   "TO_OFFICE"  "$LONDON_ID"  "4.600")"
S12="$(create_shipment "$COMPANY_ID" "$IVAN_C"    "$ALEX_C"    "$GEORGI_E"  "TO_OFFICE"  "$THESS_ID"   "9.900")"
print_id "shipment:Мария→Иван"      "$S1"
print_id "shipment:Иван→Анна"       "$S2"
print_id "shipment:Анна→Стоян"      "$S3"
print_id "shipment:Стоян→Борис"     "$S4"
print_id "shipment:Борис→Калина"    "$S5"
print_id "shipment:Калина→Мария"    "$S6"
print_id "shipment:Αλέξ→Σοφία"     "$S7"
print_id "shipment:Σοφία→Sarah"     "$S8"
print_id "shipment:Sarah→Michael"   "$S9"
print_id "shipment:Michael→Иван"    "$S10"
print_id "shipment:Мария→Sarah"     "$S11"
print_id "shipment:Иван→Αλέξ"      "$S12"
echo

echo "Applying shipment statuses..."
mark_in_transit "$S1"
mark_in_transit "$S3"
mark_in_transit "$S7"
mark_in_transit "$S11"
mark_delivered  "$S2"
mark_delivered  "$S8"
mark_delivered  "$S9"
mark_cancelled  "$S4"
echo "  statuses applied"
echo

cat <<SUMMARY
Demo data insertion completed.

Login examples:
  admin / admin
  elena.office / ${DEMO_PASSWORD}      (офис служител, София)
  georgi.office / ${DEMO_PASSWORD}     (офис служител, Пловдив)
  andreas.office / ${DEMO_PASSWORD}    (office employee, Thessaloniki)
  james.office / ${DEMO_PASSWORD}      (office employee, London)
  nikolay.c / ${DEMO_PASSWORD}         (куриер, София)
  kostas.c / ${DEMO_PASSWORD}          (courier, Thessaloniki)
  oliver.c / ${DEMO_PASSWORD}          (courier, London)
  maria.c / ${DEMO_PASSWORD}           (клиент)
  sarah.c / ${DEMO_PASSWORD}           (client)
  alex.c / ${DEMO_PASSWORD}            (πελάτης)

Useful checks:
  curl -sS ${API_USER}
  curl -sS ${API_COMPANY}
  curl -sS ${API_OFFICE}
  curl -sS ${API_CLIENT}
  curl -sS ${API_EMPLOYEE}
  curl -sS ${API_SHIPMENT}
SUMMARY
