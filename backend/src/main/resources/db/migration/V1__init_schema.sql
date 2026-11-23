-- KidsLink initial schema (Task 0.1)
-- 38 tables ported from the old Mongoose models.

CREATE TABLE schools (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_name         varchar(255) NOT NULL,
    address             text NOT NULL,
    phone               varchar(30) UNIQUE,
    email               varchar(255) UNIQUE,
    logo_url            text NOT NULL DEFAULT '',
    status              smallint NOT NULL DEFAULT 1,
    qr_data             text,
    payos_client_id     varchar(255),
    payos_api_key       varchar(255),
    payos_checksum_key  varchar(255),
    payos_account_number varchar(64),
    payos_account_name  varchar(255),
    payos_bank_code     varchar(64),
    payos_active        boolean NOT NULL DEFAULT false,
    payos_webhook_url   text,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE class_ages (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    age         int NOT NULL,
    age_name    varchar(100) NOT NULL,
    school_id   uuid NOT NULL REFERENCES schools (id),
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- teacher_id / co_teacher_id reference teachers(id), added via ALTER at the end
-- to break the circular dependency (teachers -> users -> schools, classes -> teachers).
CREATE TABLE classes (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    class_name      varchar(150) NOT NULL,
    academic_year   varchar(20) NOT NULL,
    school_id       uuid NOT NULL REFERENCES schools (id),
    class_age_id    uuid NOT NULL REFERENCES class_ages (id),
    teacher_id      uuid,
    co_teacher_id   uuid,
    start_date      date NOT NULL,
    end_date        date NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name       varchar(255) NOT NULL,
    username        varchar(100) UNIQUE,
    password_hash   varchar(255),
    role            varchar(32) NOT NULL CHECK (role IN ('admin', 'school_admin', 'teacher', 'parent', 'health_care_staff', 'nutrition_staff')),
    avatar_url      text NOT NULL DEFAULT '',
    status          smallint NOT NULL DEFAULT 1,
    email           varchar(255) UNIQUE,
    phone_number    varchar(30) UNIQUE,
    school_id       uuid REFERENCES schools (id),
    address         text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE parents (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL UNIQUE REFERENCES users (id),
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE teachers (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    qualification     varchar(255),
    major             varchar(255),
    experience_years  int DEFAULT 0,
    note              text,
    user_id           uuid NOT NULL UNIQUE REFERENCES users (id),
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE health_care_staffs (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    qualification     varchar(255),
    major             varchar(255),
    experience_years  int DEFAULT 0,
    note              text,
    user_id           uuid NOT NULL UNIQUE REFERENCES users (id),
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE students (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name   varchar(255) NOT NULL,
    school_id   uuid REFERENCES schools (id),
    dob         date NOT NULL,
    gender      smallint NOT NULL,
    avatar_url  text DEFAULT '',
    status      smallint NOT NULL DEFAULT 1,
    allergy     text DEFAULT '',
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE parent_students (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id       uuid NOT NULL REFERENCES parents (id),
    student_id      uuid NOT NULL REFERENCES students (id),
    relationship    varchar(50) NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (parent_id, student_id)
);

CREATE TABLE student_classes (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id  uuid NOT NULL REFERENCES students (id),
    class_id    uuid NOT NULL REFERENCES classes (id),
    discount    numeric(5, 2) NOT NULL DEFAULT 0,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (student_id, class_id)
);

CREATE TABLE slots (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_name   varchar(100) NOT NULL,
    start_time  varchar(10) NOT NULL,
    end_time    varchar(10) NOT NULL,
    school_id   uuid NOT NULL REFERENCES schools (id),
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE activities (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_name    varchar(255) NOT NULL,
    description      text NOT NULL,
    require_outdoor  smallint DEFAULT 0,
    school_id        uuid NOT NULL REFERENCES schools (id),
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE week_days (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week  varchar(20) NOT NULL,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE calendars (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id     uuid NOT NULL REFERENCES classes (id),
    weekday_id   uuid NOT NULL REFERENCES week_days (id),
    date         date NOT NULL,
    slot_id      uuid NOT NULL REFERENCES slots (id),
    activity_id  uuid NOT NULL REFERENCES activities (id),
    teacher_id   uuid NOT NULL REFERENCES teachers (id),
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE meals (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    meal        varchar(100) NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE dishes (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dish_name    varchar(255) NOT NULL,
    description  text NOT NULL,
    school_id    uuid NOT NULL REFERENCES schools (id),
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE dish_meals (
    dish_id  uuid NOT NULL REFERENCES dishes (id),
    meal_id  uuid NOT NULL REFERENCES meals (id),
    PRIMARY KEY (dish_id, meal_id)
);

CREATE TABLE class_age_meals (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    class_age_id  uuid NOT NULL REFERENCES class_ages (id),
    meal_id       uuid NOT NULL REFERENCES meals (id),
    weekday_id    uuid NOT NULL REFERENCES week_days (id),
    date          date NOT NULL,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE dishes_class_age_meals (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    class_age_meal_id uuid NOT NULL REFERENCES class_age_meals (id) ON DELETE CASCADE,
    dish_id           uuid NOT NULL REFERENCES dishes (id),
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now(),
    UNIQUE (class_age_meal_id, dish_id)
);

CREATE TABLE fees (
    id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id              uuid NOT NULL REFERENCES schools (id),
    fee_name               varchar(255) NOT NULL,
    description            text NOT NULL,
    amount                 numeric(14, 2) NOT NULL,
    late_fee_type          varchar(20) NOT NULL DEFAULT 'none',
    late_fee_value         numeric(14, 2) NOT NULL DEFAULT 0,
    late_fee_description   text DEFAULT '',
    created_at             timestamptz NOT NULL DEFAULT now(),
    updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE class_fees (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id    uuid NOT NULL REFERENCES classes (id),
    fee_id      uuid NOT NULL REFERENCES fees (id),
    due_date    date NOT NULL,
    note        text,
    status      smallint NOT NULL DEFAULT 1,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE payments (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_time    varchar(10) NOT NULL,
    payment_method  smallint NOT NULL DEFAULT 1,
    total_amount    numeric(14, 2) NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE invoices (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    class_fee_id        uuid NOT NULL REFERENCES class_fees (id),
    amount_due          numeric(14, 2) NOT NULL,
    due_date            date NOT NULL,
    student_class_id    uuid NOT NULL REFERENCES student_classes (id),
    discount            numeric(5, 2) NOT NULL DEFAULT 0,
    payment_id          uuid REFERENCES payments (id),
    status              smallint NOT NULL DEFAULT 0,
    payos_order_code    bigint,
    payos_checkout_url  text,
    payos_qr_code       text,
    payos_qr_url        text,
    payos_expired_at    timestamptz,
    payos_transaction_id varchar(255),
    late_fee_amount     numeric(14, 2),
    late_fee_applied_at timestamptz,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE posts (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    content     text NOT NULL,
    status      varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
    user_id     uuid NOT NULL REFERENCES users (id),
    class_id    uuid REFERENCES classes (id),
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE post_images (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url   text NOT NULL,
    post_id     uuid NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE post_comments (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    contents           text NOT NULL,
    create_at          timestamptz NOT NULL DEFAULT now(),
    post_id            uuid NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
    user_id            uuid NOT NULL REFERENCES users (id),
    parent_comment_id  uuid REFERENCES post_comments (id),
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE post_likes (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id     uuid NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
    user_id     uuid NOT NULL REFERENCES users (id),
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (post_id, user_id)
);

CREATE TABLE conversations (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title            varchar(255) NOT NULL,
    create_at        timestamptz NOT NULL DEFAULT now(),
    last_message_at  timestamptz NOT NULL DEFAULT now(),
    class_id         uuid REFERENCES classes (id),
    is_class_group   boolean NOT NULL DEFAULT false,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE conversation_participants (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          uuid NOT NULL REFERENCES users (id),
    conversation_id  uuid NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, conversation_id)
);

CREATE TABLE messages (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    content          text,
    image_url        text,
    image_public_id  text,
    send_at          timestamptz NOT NULL DEFAULT now(),
    read_status      smallint NOT NULL DEFAULT 0,
    conversation_id  uuid NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
    sender_id        uuid NOT NULL REFERENCES users (id),
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),
    CHECK (content IS NOT NULL OR image_url IS NOT NULL)
);

CREATE TABLE complaint_types (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id    uuid NOT NULL REFERENCES schools (id),
    name         varchar(255) NOT NULL,
    description  text,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE complaint_type_categories (
    complaint_type_id  uuid NOT NULL REFERENCES complaint_types (id) ON DELETE CASCADE,
    category           varchar(20) NOT NULL CHECK (category IN ('teacher', 'parent')),
    PRIMARY KEY (complaint_type_id, category)
);

CREATE TABLE complaints (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_type_id     uuid NOT NULL REFERENCES complaint_types (id),
    school_id             uuid NOT NULL REFERENCES schools (id),
    complaint_type_name   varchar(255) NOT NULL,
    reason                text NOT NULL,
    image                 text,
    status                varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approve', 'reject')),
    user_id               uuid NOT NULL REFERENCES users (id),
    response              text,
    created_at            timestamptz NOT NULL DEFAULT now(),
    updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE daily_reports (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_date         date NOT NULL,
    checkin_time        varchar(10),
    checkout_time       varchar(10),
    comments            text,
    student_id          uuid NOT NULL REFERENCES students (id),
    teacher_checkin_id  uuid REFERENCES teachers (id),
    teacher_checkout_id uuid REFERENCES teachers (id),
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    UNIQUE (student_id, report_date)
);

CREATE TABLE health_records (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    checkup_date          date NOT NULL,
    height_cm             numeric(5, 1) NOT NULL,
    weight_kg             numeric(5, 1) NOT NULL,
    note                  text NOT NULL,
    student_id            uuid NOT NULL REFERENCES students (id),
    health_care_staff_id  uuid NOT NULL REFERENCES health_care_staffs (id),
    created_at            timestamptz NOT NULL DEFAULT now(),
    updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE health_notices (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id            uuid NOT NULL REFERENCES students (id),
    symptoms              text NOT NULL,
    actions_taken         text NOT NULL,
    medications           text NOT NULL,
    notice_time           varchar(10) NOT NULL,
    note                   text NOT NULL,
    health_care_staff_id  uuid NOT NULL REFERENCES health_care_staffs (id),
    created_at            timestamptz NOT NULL DEFAULT now(),
    updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE pickups (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name       varchar(255) NOT NULL,
    relationship    varchar(50) NOT NULL,
    id_card_number  varchar(30) NOT NULL UNIQUE,
    avatar_url      text NOT NULL DEFAULT '',
    phone           varchar(30) NOT NULL UNIQUE,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE pickup_students (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pickup_id   uuid NOT NULL REFERENCES pickups (id) ON DELETE CASCADE,
    student_id  uuid NOT NULL REFERENCES students (id) ON DELETE CASCADE,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (pickup_id, student_id)
);

-- Deferred FKs: classes -> teachers (breaks the circular dependency)
ALTER TABLE classes
    ADD CONSTRAINT fk_classes_teacher FOREIGN KEY (teacher_id) REFERENCES teachers (id),
    ADD CONSTRAINT fk_classes_co_teacher FOREIGN KEY (co_teacher_id) REFERENCES teachers (id);

-- Indexes
CREATE INDEX idx_users_school_id ON users (school_id);
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_students_school_id ON students (school_id);
CREATE INDEX idx_classes_school_id ON classes (school_id);
CREATE INDEX idx_posts_class_created ON posts (class_id, created_at DESC);
CREATE INDEX idx_posts_user_id ON posts (user_id);
CREATE INDEX idx_messages_conversation_send ON messages (conversation_id, send_at DESC);
CREATE INDEX idx_invoices_class_fee_id ON invoices (class_fee_id);
CREATE INDEX idx_complaints_school_id ON complaints (school_id);
CREATE INDEX idx_calendars_class_date ON calendars (class_id, date);
CREATE INDEX idx_daily_reports_student_date ON daily_reports (student_id, report_date);
