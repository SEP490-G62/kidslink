# Attendance Workflow - Quy trình điểm danh học sinh

## Main Workflow Diagram (Swimlane)

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'fontSize':'14px'}}}%%
flowchart TD
    subgraph KidsLink[" "]
        direction TB
        S1[" "]
        Start((Start: Access<br/>attendance page))
        S2[" "]
        style S1 fill:none,stroke:none
        style S2 fill:none,stroke:none
    end

    subgraph Teacher["Giáo viên / Teacher"]
        direction TB
        T1[" "]
        SelectClass["Select class and<br/>attendance date"]
        MarkAttendance["Mark attendance status<br/>for each student<br/>(Present/Absent/Excused)"]
        ClickSave["Click Save button"]
        T2[" "]
        style T1 fill:none,stroke:none
        style T2 fill:none,stroke:none
    end

    subgraph System["Hệ thống / System"]
        direction TB
        Sys1[" "]
        LoadStudents["Load student list<br/>from database"]
        DisplayList["Display student list<br/>with attendance form"]
        Validate{"Validate<br/>data"}
        ShowError["Show error: Invalid<br/>or missing data"]
        SaveData["Save attendance<br/>records to database"]
        CheckSave{"Save<br/>successful?"}
        ShowSaveError["Show error:<br/>Save failed"]
        SendNotif["Send notification to<br/>parents of absent students"]
        ShowSuccess["Show success message"]
        Sys2[" "]
        style Sys1 fill:none,stroke:none
        style Sys2 fill:none,stroke:none
    end

    subgraph Parent["Phụ huynh / Parent"]
        direction TB
        P1[" "]
        ReceiveNotif["Receive absence<br/>notification"]
        P2[" "]
        style P1 fill:none,stroke:none
        style P2 fill:none,stroke:none
    end

    Start --> SelectClass
    SelectClass --> LoadStudents
    LoadStudents --> DisplayList
    DisplayList --> MarkAttendance
    MarkAttendance --> ClickSave
    ClickSave --> Validate
    Validate -->|No| ShowError
    ShowError --> MarkAttendance
    Validate -->|Yes| SaveData
    SaveData --> CheckSave
    CheckSave -->|No| ShowSaveError
    ShowSaveError --> ClickSave
    CheckSave -->|Yes| SendNotif
    SendNotif --> ShowSuccess
    SendNotif -.-> ReceiveNotif
    ShowSuccess --> End((End: Successful<br/>attendance))

    style Start fill:#90EE90,stroke:#333,stroke-width:2px
    style End fill:#90EE90,stroke:#333,stroke-width:2px
    style SelectClass fill:#E3F2FD,stroke:#333,stroke-width:2px
    style MarkAttendance fill:#E3F2FD,stroke:#333,stroke-width:2px
    style ClickSave fill:#E3F2FD,stroke:#333,stroke-width:2px
    style LoadStudents fill:#FFF3E0,stroke:#333,stroke-width:2px
    style DisplayList fill:#FFF3E0,stroke:#333,stroke-width:2px
    style SaveData fill:#FFF3E0,stroke:#333,stroke-width:2px
    style SendNotif fill:#FFF3E0,stroke:#333,stroke-width:2px
    style ShowSuccess fill:#FFF3E0,stroke:#333,stroke-width:2px
    style ShowError fill:#FFEBEE,stroke:#333,stroke-width:2px
    style ShowSaveError fill:#FFEBEE,stroke:#333,stroke-width:2px
    style Validate fill:#FFF9C4,stroke:#333,stroke-width:2px
    style CheckSave fill:#FFF9C4,stroke:#333,stroke-width:2px
    style ReceiveNotif fill:#F3E5F5,stroke:#333,stroke-width:2px
```

## Sequence Diagram

```mermaid
sequenceDiagram
    actor T as Giáo viên
    participant UI as Giao diện
    participant API as Backend API
    participant DB as Database
    participant N as Notification Service

    T->>UI: Truy cập mục Điểm danh
    UI->>API: GET /attendance/students
    API->>DB: Lấy danh sách học sinh
    DB-->>API: Trả về danh sách
    API-->>UI: Danh sách học sinh
    UI-->>T: Hiển thị danh sách

    loop Cho từng học sinh
        T->>UI: Chọn trạng thái (Có mặt/Vắng/Có phép/Không phép)
        UI->>UI: Cập nhật trạng thái tạm
    end

    T->>UI: Nhấn nút Lưu
    UI->>API: POST /attendance/save
    API->>API: Validate dữ liệu
    
    alt Dữ liệu hợp lệ
        API->>DB: Lưu kết quả điểm danh
        DB-->>API: Xác nhận lưu thành công
        API->>N: Gửi thông báo cho phụ huynh HS vắng
        N-->>API: Đã gửi thông báo
        API-->>UI: Lưu thành công
        UI-->>T: Hiển thị thông báo thành công
    else Dữ liệu không hợp lệ
        API-->>UI: Lỗi validation
        UI-->>T: Hiển thị lỗi, yêu cầu kiểm tra lại
    else Lỗi hệ thống
        API-->>UI: Lỗi lưu dữ liệu
        UI-->>T: Hiển thị lỗi, giữ nguyên trạng thái
    end
```

## Activity Diagram (Chi tiết)

```mermaid
stateDiagram-v2
    [*] --> CheckLogin
    CheckLogin --> Login : Chưa đăng nhập
    CheckLogin --> AccessAttendance : Đã đăng nhập
    Login --> AccessAttendance
    
    AccessAttendance --> LoadData
    LoadData --> CheckStudents
    
    CheckStudents --> NoStudents : Không có dữ liệu
    CheckStudents --> DisplayList : Có dữ liệu
    
    NoStudents --> [*]
    
    DisplayList --> SelectStatus
    SelectStatus --> Present : Chọn Có mặt
    SelectStatus --> Absent : Chọn Vắng
    SelectStatus --> Excused : Chọn Có phép
    SelectStatus --> Unexcused : Chọn Không phép
    
    Present --> MoreStudents
    Absent --> MoreStudents
    Excused --> MoreStudents
    Unexcused --> MoreStudents
    
    MoreStudents --> SelectStatus : Còn học sinh
    MoreStudents --> SaveData : Đã hoàn thành
    
    SaveData --> Validate
    Validate --> ErrorValidation : Không hợp lệ
    Validate --> SaveDB : Hợp lệ
    
    ErrorValidation --> SelectStatus
    
    SaveDB --> CheckSave
    CheckSave --> ErrorSave : Lỗi lưu
    CheckSave --> Success : Thành công
    
    ErrorSave --> SaveData
    
    Success --> NotifyParents
    NotifyParents --> [*]
```

## Giải thích các bước:

### 1. Khởi đầu
- Giáo viên đăng nhập hệ thống
- Truy cập mục "Điểm danh"

### 2. Tải dữ liệu
- Hệ thống tải danh sách học sinh trong lớp
- Kiểm tra dữ liệu có tồn tại

### 3. Điểm danh
- Hiển thị danh sách học sinh
- Giáo viên chọn trạng thái cho từng học sinh:
  - **Có mặt**: Học sinh có mặt đầy đủ
  - **Vắng**: Học sinh vắng mặt
  - **Có phép**: Học sinh xin phép trước
  - **Không phép**: Học sinh vắng không phép

### 4. Lưu kết quả
- Giáo viên nhấn nút "Lưu"
- Hệ thống validate dữ liệu
- Lưu vào database

### 5. Thông báo
- Hệ thống tự động gửi thông báo cho phụ huynh của học sinh vắng mặt
- Hiển thị thông báo thành công cho giáo viên

### 6. Xử lý lỗi
- **Lỗi validation**: Yêu cầu giáo viên kiểm tra lại
- **Lỗi lưu dữ liệu**: Giữ nguyên trạng thái, cho phép thử lại

## Các trạng thái điểm danh

| Trạng thái | Mô tả | Hành động hệ thống |
|-----------|-------|-------------------|
| Có mặt | Học sinh có mặt đầy đủ | Không thông báo |
| Vắng | Học sinh vắng mặt | Gửi thông báo phụ huynh |
| Có phép | Học sinh xin phép trước | Ghi nhận, có thể thông báo |
| Không phép | Học sinh vắng không phép | Gửi cảnh báo phụ huynh |

## Liên quan Use Cases
- **UC-T-003**: Ghi nhận điểm danh học sinh (Teacher)
- **UC-P-002**: Xem thông tin điểm danh con (Parent)
- **UC-P-003**: Gửi đơn xin phép nghỉ học (Parent)
