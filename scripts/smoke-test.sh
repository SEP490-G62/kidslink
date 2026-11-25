#!/usr/bin/env bash
# KidsLink API smoke test — kiểm thử toàn bộ endpoint chính của 6 role.
# Dùng: bash scripts/smoke-test.sh   (cần backend chạy ở $BASE)

set -u
BASE="${BASE:-http://localhost:18080/api}"
PASS=0; FAIL=0; TOTAL=0
GREEN=$'\033[32m'; RED=$'\033[31m'; RESET=$'\033[0m'
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

login() {
  curl -s -X POST "$BASE/auth/login" -H 'Content-Type: application/json' \
    -d "{\"username\":\"$1\",\"password\":\"$2\"}" |
    grep -o '"token":"[^"]*"' | cut -d'"' -f4
}

# check <tên> <HTTP mong đợi> <path> <token> [method] [body]
check() {
  local name="$1" expected="$2" path="$3" token="$4" method="${5:-GET}" body="${6:-}"
  TOTAL=$((TOTAL+1))
  local code
  if [ -n "$body" ]; then
    code=$(curl -s -o "$TMP/resp.json" -w "%{http_code}" -X "$method" "$BASE$path" \
      -H "Authorization: Bearer $token" -H 'Content-Type: application/json' -d "$body")
  else
    code=$(curl -s -o "$TMP/resp.json" -w "%{http_code}" -X "$method" "$BASE$path" \
      -H "Authorization: Bearer $token")
  fi
  if [ "$code" = "$expected" ]; then
    PASS=$((PASS+1)); echo "${GREEN}PASS${RESET} $name ($code)"
  else
    FAIL=$((FAIL+1)); echo "${RED}FAIL${RESET} $name (got $code, want $expected) -- $(head -c 160 "$TMP/resp.json")"
  fi
}

echo "=== KidsLink API Smoke Test: $BASE ==="

echo "-- Login 6 role --"
SA=$(login superadmin Admin@123)
SCH=$(login schooladmin Admin@123)
TCH=$(login teacher1 Teacher@123)
PAR=$(login parent1 Parent@123)
NUR=$(login nurse1 Nurse@123)
COO=$(login cook1 Cook@123)
for pair in "superadmin:$SA" "schooladmin:$SCH" "teacher1:$TCH" "parent1:$PAR" "nurse1:$NUR" "cook1:$COO"; do
  if [ -z "${pair#*:}" ]; then echo "${RED}ERROR${RESET} login failed: ${pair%%:*}"; exit 1; fi
done
echo "6/6 logins OK"

echo "-- Auth / User --"
check "GET /users/me (superadmin)" 200 /users/me "$SA"
check "GET /users (admin)"          200 /users    "$SA"
check "GET /users?role=teacher"     200 "/users?role=teacher" "$SA"

echo "-- Admin --"
check "GET /admin/schools" 200 /admin/schools "$SA"

echo "-- School admin --"
check "GET /school-admin/school"                 200 /school-admin/school "$SCH"
check "GET /users?schoolId (school admin scoped)" 200 /users "$SCH"
check "GET /class-ages"                          200 /class-ages "$SCH"
check "GET /classes"                             200 /classes "$SCH"
check "GET /student/all"                         200 /student/all "$SCH"
check "GET /parentcrud"                          200 /parentcrud "$SCH"
check "GET /school-admin/calendar/slots"         200 /school-admin/calendar/slots "$SCH"
check "GET /school-admin/calendar/activities"    200 /school-admin/calendar/activities "$SCH"
check "GET /school-admin/calendar/teachers"      200 /school-admin/calendar/teachers "$SCH"
check "GET /school-admin/fees"                   200 /school-admin/fees "$SCH"
check "GET /school-admin/complaints"             200 /school-admin/complaints "$SCH"
check "GET /school-admin/complaints/stats"       200 /school-admin/complaints/stats "$SCH"
check "GET /school-admin/complaints/types/list"  200 /school-admin/complaints/types/list "$SCH"
check "GET /school-admin/posts"                  200 /school-admin/posts "$SCH"
check "GET /messaging/conversations"             200 /messaging/conversations "$SCH"
check "GET /messaging/unread-count"              200 /messaging/unread-count "$SCH"

echo "-- Teacher --"
check "GET /teachers/class"                      200 /teachers/class "$TCH"
check "GET /teachers/class/students"             200 /teachers/class/students "$TCH"
check "GET /teachers/class-calendar"             200 /teachers/class-calendar "$TCH"
check "GET /teachers/class-calendar/slots"       200 /teachers/class-calendar/slots "$TCH"
check "GET /teachers/teaching-calendar"          200 /teachers/teaching-calendar "$TCH"
check "GET /teachers/posts"                      200 /teachers/posts "$TCH"
check "GET /teachers/complaints"                 200 /teachers/complaints "$TCH"
check "GET /teachers/complaints/types"           200 /teachers/complaints/types "$TCH"
check "GET /messaging/conversations (teacher)"   200 /messaging/conversations "$TCH"

echo "-- Parent --"
check "GET /parent/children"                     200 /parent/children "$PAR"
check "GET /parent/posts"                        200 /parent/posts "$PAR"
check "GET /parent/class-calendar"               200 /parent/class-calendar "$PAR"
check "GET /parent/class-calendar/slots"         200 /parent/class-calendar/slots "$PAR"
check "GET /parent/menu"                         200 /parent/menu "$PAR"
check "GET /parent/fees"                         200 /parent/fees "$PAR"
check "GET /parent/fees/unpaid-count"            200 /parent/fees/unpaid-count "$PAR"
check "GET /parent/daily-reports"                200 /parent/daily-reports "$PAR"
check "GET /parent/complaints"                   200 /parent/complaints "$PAR"
check "GET /parent/complaints/types"             200 /parent/complaints/types "$PAR"
check "GET /messaging/conversations (parent)"    200 /messaging/conversations "$PAR"

echo "-- Health staff --"
check "GET /health-staff/classes"                200 /health-staff/classes "$NUR"
check "GET /health-staff/health/records"         200 /health-staff/health/records "$NUR"
check "GET /health-staff/health/notices"         200 /health-staff/health/notices "$NUR"
check "GET /health-staff/profile"                200 /health-staff/profile "$NUR"

echo "-- Nutrition staff --"
check "GET /nutrition/dishes"                    200 /nutrition/dishes "$COO"
check "GET /nutrition/meals"                     200 /nutrition/meals "$COO"
check "GET /nutrition/weekdays"                  200 /nutrition/weekdays "$COO"
check "GET /nutrition/class-ages"                200 /nutrition/class-ages "$COO"
check "GET /nutrition/class-age-meals"           200 /nutrition/class-age-meals "$COO"
CA_ID=$(curl -s -H "Authorization: Bearer $COO" "$BASE/nutrition/class-ages" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
MEAL_ID=$(curl -s -H "Authorization: Bearer $COO" "$BASE/nutrition/meals" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
WD_ID=$(curl -s -H "Authorization: Bearer $COO" "$BASE/nutrition/weekdays" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
DATE_T=$(date +%Y-%m-%d)
check "GET /nutrition/class-age-meals/dishes"    200 "/nutrition/class-age-meals/dishes?class_age_id=$CA_ID&meal_id=$MEAL_ID&weekday_id=$WD_ID&date=$DATE_T" "$COO"
WEEK_START=$(date +%Y-%m-%d)
check "GET /nutrition/class-age-meals/weekly-dishes" 200 "/nutrition/class-age-meals/weekly-dishes?week_start=$WEEK_START" "$COO"
check "GET /nutrition/profile"                   200 /nutrition/profile "$COO"

echo "-- Security: không token phải 401/403 --"
TOTAL=$((TOTAL+1))
UNAUTH=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/users")
if [ "$UNAUTH" = "401" ] || [ "$UNAUTH" = "403" ]; then
  PASS=$((PASS+1)); echo "${GREEN}PASS${RESET} unauthenticated /users blocked ($UNAUTH)"
else
  FAIL=$((FAIL+1)); echo "${RED}FAIL${RESET} unauthenticated /users got $UNAUTH"
fi

echo
echo "=== Summary: PASS=$PASS FAIL=$FAIL TOTAL=$TOTAL ==="
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
