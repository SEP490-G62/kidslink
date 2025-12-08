# Class Diagram - Manage Slot (School Admin)

## Mô tả
Class diagram này mô tả kiến trúc của chức năng quản lý tiết học (Slot) cho School Admin trong hệ thống KidsLink.

## Các Class chính

### 1. SchoolAdminCalendarRoutes
- **Vai trò**: Đăng ký các routes cho quản lý lịch học
- **Methods**:
  - `registerRoutes(router: ExpressRouter): void` - Đăng ký các routes cho slot management

### 2. SlotController
- **Vai trò**: Xử lý logic nghiệp vụ cho quản lý slot
- **Methods**:
  - `getAllSlots(req: Request, res: Response): void` - Lấy danh sách tất cả slot (filter theo school_id)
  - `createSlot(req: Request, res: Response): void` - Tạo slot mới (validate overlapping)
  - `updateSlot(req: Request, res: Response): void` - Cập nhật slot (check ownership)
  - `deleteSlot(req: Request, res: Response): void` - Xóa slot (check if used in Calendar)

### 3. SlotModel
- **Vai trò**: Model đại diện cho dữ liệu Slot trong database
- **Attributes**:
  - `_id: ObjectId` - ID của slot
  - `slot_name: String` - Tên tiết học (required)
  - `start_time: String` - Giờ bắt đầu (required)
  - `end_time: String` - Giờ kết thúc (required)
  - `school_id: ObjectId` - ID của trường (required)
  - `createdAt: Date` - Ngày tạo
  - `updatedAt: Date` - Ngày cập nhật
- **Methods**:
  - `find(query: Object): Promise<Slot[]>` - Tìm nhiều slot
  - `findOne(query: Object): Promise<Slot>` - Tìm một slot
  - `findById(id: ObjectId): Promise<Slot>` - Tìm slot theo ID
  - `create(data: Object): Promise<Slot>` - Tạo slot mới
  - `findByIdAndUpdate(id: ObjectId, data: Object): Promise<Slot>` - Cập nhật slot
  - `findByIdAndDelete(id: ObjectId): Promise<Slot>` - Xóa slot

### 4. AuthMiddleware
- **Vai trò**: Xác thực và phân quyền
- **Methods**:
  - `authenticate(req, res, next): void` - Xác thực JWT token
  - `authorize(allowedRoles: String[]): void` - Kiểm tra quyền truy cập (school_admin, admin)

### 5. ErrorHandlerMiddleware
- **Vai trò**: Xử lý lỗi
- **Methods**:
  - `handleError(err, req, res, next): void` - Xử lý các lỗi trong quá trình xử lý request

### 6. UserModel
- **Vai trò**: Model đại diện cho User
- **Attributes**:
  - `_id: ObjectId` - ID của user
  - `school_id: ObjectId` - ID của trường
- **Methods**:
  - `findById(id: ObjectId): Promise<User>` - Tìm user theo ID (để lấy school_id của admin)

### 7. CalendarModel
- **Vai trò**: Model đại diện cho Calendar (để kiểm tra slot có đang được sử dụng)
- **Attributes**:
  - `_id: ObjectId` - ID của calendar entry
  - `slot_id: ObjectId` - ID của slot được sử dụng
- **Methods**:
  - `countDocuments(query: Object): Promise<Number>` - Đếm số lượng calendar entries sử dụng slot

## Relationships

1. **SchoolAdminCalendarRoutes → SlotController**: Routes sử dụng Controller để xử lý requests
2. **SlotController → SlotModel**: Controller tương tác với Model để truy vấn dữ liệu (find, create, update, delete)
3. **SlotController → AuthMiddleware**: Controller sử dụng middleware để xác thực và phân quyền
4. **SlotController → UserModel**: Controller truy vấn User để lấy school_id của admin
5. **SlotController → CalendarModel**: Controller kiểm tra số lượng calendar entries sử dụng slot trước khi xóa
6. **AuthMiddleware → ErrorHandlerMiddleware**: Middleware xử lý lỗi từ authentication/authorization

## Business Rules

1. **Filter by school_id**: School admin chỉ có thể quản lý slot của trường mình
2. **Overlapping validation**: Không được tạo slot có thời gian trùng với slot khác trong cùng trường
3. **Ownership validation**: Chỉ có thể sửa/xóa slot của trường mình
4. **Usage check**: Không thể xóa slot đang được sử dụng trong Calendar

