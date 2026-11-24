#!/bin/bash
# E2E smoke test for posts + messaging (Task 6.1-6.3). Requires app running on $PORT.
set -e
PORT="${PORT:-18082}"
BASE="http://localhost:$PORT/api"

post() { curl -s -X POST "$BASE/$2" -H "Authorization: Bearer $1" -H "Content-Type: application/json" -d "$3"; }
put()  { curl -s -X PUT  "$BASE/$2" -H "Authorization: Bearer $1" -H "Content-Type: application/json" -d "$3"; }
get()  { curl -s "$BASE/$2" -H "Authorization: Bearer $1"; }
del()  { curl -s -X DELETE "$BASE/$2" -H "Authorization: Bearer $1"; }

reg() { # username role -> token (register)
  curl -s -X POST "$BASE/auth/register" -H "Content-Type: application/json" -d "$2" \
    | sed 's/.*"token":"\([^"]*\)".*/\1/'
}
login() { # username password -> token
  curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" \
    -d "{\"username\":\"$1\",\"password\":\"$2\"}" | sed 's/.*"token":"\([^"]*\)".*/\1/'
}

echo "== register users =="
SA_TOKEN=$(reg x '{"full_name":"Test School Admin","username":"t_schooladmin","password":"Test@1234","role":"school_admin","email":"t_schooladmin@test.local","phone_number":"0999000001"}')
T_TOKEN=$(reg x '{"full_name":"Test Teacher","username":"t_teacher","password":"Test@1234","role":"teacher","email":"t_teacher@test.local","phone_number":"0999000002"}')
P_TOKEN=$(reg x '{"full_name":"Test Parent","username":"t_parent","password":"Test@1234","role":"parent","email":"t_parent@test.local","phone_number":"0999000003"}')
echo "sa=${SA_TOKEN:0:20}... t=${T_TOKEN:0:20}... p=${P_TOKEN:0:20}..."

echo "== seed school/class/student links via SQL =="
docker exec kidslink-postgres psql -U kidslink -d kidslink -q <<'SQL'
insert into schools (school_name, address, phone, email, logo_url, status)
values ('Test Preschool', '1 Test St', '0900000001', 'test@test.local', '', 1);
update users set school_id = (select id from schools where school_name='Test Preschool');
insert into class_ages (age, age_name, school_id)
values (3, '3 tuoi', (select id from schools where school_name='Test Preschool'));
insert into classes (class_name, academic_year, school_id, class_age_id, teacher_id, start_date, end_date)
values ('A1', '2025-2026', (select id from schools where school_name='Test Preschool'),
        (select id from class_ages where age=3),
        (select t.id from teachers t join users u on u.id=t.user_id where u.username='t_teacher'),
        '2025-09-01', '2026-05-31');
insert into students (full_name, school_id, dob, gender, status, allergy)
values ('Kid One', (select id from schools where school_name='Test Preschool'), '2022-01-05', 0, 1, '');
insert into parent_students (parent_id, student_id, relationship)
values ((select p.id from parents p join users u on u.id=p.user_id where u.username='t_parent'),
        (select id from students where full_name='Kid One'), 'me');
insert into student_classes (student_id, class_id, discount)
values ((select id from students where full_name='Kid One'),
        (select id from classes where class_name='A1'), 0);
SQL

echo "== login again (tokens now carry school_id) =="
SA_TOKEN=$(login t_schooladmin Test@1234)
T_TOKEN=$(login t_teacher Test@1234)
P_TOKEN=$(login t_parent Test@1234)
echo "sa=${SA_TOKEN:0:20}..."

echo "== parent creates post (pending) =="
POST=$(post "$P_TOKEN" "parent/posts" '{"content":"Hello from parent"}')
echo "$POST"
POST_ID=$(echo "$POST" | sed 's/.*"id":"\([^"]*\)".*/\1/')

echo "== teacher feed before approval (must NOT contain post) =="
get "$T_TOKEN" "teachers/posts"

echo "== school admin approves =="
put "$SA_TOKEN" "school-admin/posts/$POST_ID/status" '{"status":"approved"}'

echo "== teacher feed after approval (must contain post) =="
get "$T_TOKEN" "teachers/posts"

echo "== school admin feed (all statuses) =="
get "$SA_TOKEN" "school-admin/posts"
C1=$(post "$P_TOKEN" "parent/posts/$POST_ID/comments" '{"contents":"Thanks"}')
echo "$C1"
C1_ID=$(echo "$C1" | sed 's/.*"id":"\([^"]*\)".*/\1/')
C2=$(post "$P_TOKEN" "parent/posts/$POST_ID/comments" "{\"contents\":\"Reply\",\"parent_comment_id\":\"$C1_ID\"}")
C2_ID=$(echo "$C2" | sed 's/.*"id":"\([^"]*\)".*/\1/')
echo "-- comment tree:"
get "$P_TOKEN" "parent/posts/$POST_ID/comments"
echo "-- update comment:"
put "$P_TOKEN" "parent/comments/$C1_ID" '{"contents":"Thanks a lot"}'
echo "-- delete reply:"
del "$P_TOKEN" "parent/comments/$C2_ID"
get "$P_TOKEN" "parent/posts/$POST_ID/comments"
echo "-- likes list:"
get "$P_TOKEN" "parent/posts/$POST_ID/likes"


echo "== teacher own post (auto approved) =="
TP=$(post "$T_TOKEN" "teachers/posts" '{"content":"Teacher announcement"}')
echo "$TP"

echo "== messaging: class chat group =="
GROUP=$(post "$T_TOKEN" "teachers/class/chat-group" '{}')
echo "$GROUP"
CONV_ID=$(echo "$GROUP" | sed 's/.*"id":"\([^"]*\)".*/\1/')

echo "== teacher sends message via REST =="
post "$T_TOKEN" "messaging/messages" "{\"conversation_id\":\"$CONV_ID\",\"content\":\"Chao cac ba me\"}"

echo "== parent conversations =="
get "$P_TOKEN" "messaging/conversations"

echo "== parent messages + unread count =="
get "$P_TOKEN" "messaging/conversations/$CONV_ID/messages"
get "$P_TOKEN" "messaging/unread-count"

echo "== parent marks read =="
put "$P_TOKEN" "messaging/conversations/$CONV_ID/read" '{}'
get "$P_TOKEN" "messaging/unread-count"

echo "== direct conversation (parent) =="
post "$P_TOKEN" "messaging/conversations/direct" '{}'

echo "== teachers by student =="
STUDENT_ID=$(docker exec kidslink-postgres psql -U kidslink -d kidslink -t -A -c "select id from students where full_name='Kid One'")
get "$P_TOKEN" "messaging/teachers-by-student/$STUDENT_ID"

echo "== parents by teacher class =="
get "$T_TOKEN" "messaging/parents-by-teacher-class"

echo "== cleanup test data =="
docker exec kidslink-postgres psql -U kidslink -d kidslink -q <<'SQL'
delete from post_comments where post_id in (select id from posts);
delete from post_likes where post_id in (select id from posts);
delete from post_images where post_id in (select id from posts);
delete from posts;
delete from conversation_participants;
delete from messages;
delete from conversations;
delete from student_classes;
delete from parent_students;
delete from students;
delete from classes;
delete from class_ages;
delete from parents;
delete from teachers;
delete from users where username in ('t_schooladmin','t_teacher','t_parent');
delete from schools where school_name='Test Preschool';
SQL
echo "DONE"
