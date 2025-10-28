Hướng dẫn import dữ liệu mẫu vào MongoDB

1) Cấu trúc file JSON theo `mongoimport` (mỗi file là một mảng JSON).

2) Ví dụ lệnh (chỉnh `--db`, `--uri` theo môi trường của bạn):

```bash
mongoimport --uri "mongodb://localhost:27017/kidslink" --collection users --file users.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/kidslink" --collection schools --file schools.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/kidslink" --collection classages --file classAges.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/kidslink" --collection teachers --file teachers.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/kidslink" --collection parents --file parents.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/kidslink" --collection classes --file classes.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/kidslink" --collection students --file students.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/kidslink" --collection parentstudents --file parentStudents.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/kidslink" --collection studentclasses --file studentClasses.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/kidslink" --collection posts --file posts.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/kidslink" --collection postimages --file postImages.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/kidslink" --collection postlikes --file postLikes.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/kidslink" --collection postcomments --file postComments.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/kidslink" --collection healthcares --file healthCareStaff.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/kidslink" --collection healthrecords --file healthRecords.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/kidslink" --collection healthnotices --file healthNotices.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/kidslink" --collection pickups --file pickups.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/kidslink" --collection pickupstudents --file pickupStudents.json --jsonArray
```

3) Thứ tự khuyến nghị:
- users → schools → classAges → teachers/parents/healthcares → classes → students → quan hệ (parentStudents, studentClasses) → posts → postImages/postLikes/postComments → healthrecords → healthnotices → pickups → pickupstudents.

4) Lưu ý:
- Các khóa ngoại dùng ObjectId phải khớp giữa các file.
- Trường thời gian có thể để theo `{"$date": "ISO-8601"}` để giữ nguyên khi import.






