#!/usr/bin/env bash
# Kiểm tra nhanh mọi route frontend Next.js trả về HTTP 200/307.
# Dùng: bash scripts/smoke-test-frontend.sh   (frontend chạy ở $FE)

set -u
FE="${FE:-http://localhost:3001}"
PASS=0; FAIL=0
GREEN=$'\033[32m'; RED=$'\033[31m'; RESET=$'\033[0m'

ROUTES=(
  /
  /login
  /register
  /forgot-password
  /admin
  /admin/schools
  /admin/users
  /health-care
  /health-care/classes
  /health-care/notices
  /health-care/profile
  /health-care/records
  /nutrition
  /nutrition/dishes
  /nutrition/menu
  /nutrition/profile
  /parent
  /parent/calendar
  /parent/chat
  /parent/children
  /parent/complaints
  /parent/daily-reports
  /parent/fees
  /parent/menu
  /parent/posts
  /parent/profile
  /school-admin
  /school-admin/calendar
  /school-admin/classes
  /school-admin/complaints
  /school-admin/fees
  /school-admin/menu
  /school-admin/parents
  /school-admin/posts
  /school-admin/school
  /school-admin/students
  /teacher
  /teacher/attendance
  /teacher/calendar
  /teacher/chat
  /teacher/class
  /teacher/complaints
  /teacher/daily-reports
  /teacher/posts
  /teacher/profile
)

echo "=== KidsLink Frontend Smoke Test: $FE ==="
for r in "${ROUTES[@]}"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 25 "$FE$r")
  if [ "$code" = "200" ] || [ "$code" = "307" ] || [ "$code" = "308" ]; then
    PASS=$((PASS+1)); echo "${GREEN}PASS${RESET} $r ($code)"
  else
    FAIL=$((FAIL+1)); echo "${RED}FAIL${RESET} $r ($code)"
  fi
done

echo
echo "=== Summary: PASS=$PASS FAIL=$FAIL TOTAL=$((PASS+FAIL)) ==="
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
