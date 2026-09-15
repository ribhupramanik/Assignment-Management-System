CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    student_id VARCHAR(30) UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'student',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT users_role_check
        CHECK (role IN ('student', 'admin'))
);

CREATE TABLE groups (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_groups_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
);

CREATE TABLE group_members (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_group_members_group
        FOREIGN KEY (group_id)
        REFERENCES groups(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_group_members_student
        FOREIGN KEY (student_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_group_member
        UNIQUE (group_id, student_id)
);

CREATE TABLE assignments (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    onedrive_link TEXT NOT NULL,
    scope VARCHAR(20) NOT NULL DEFAULT 'all',
    created_by BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT assignments_scope_check
        CHECK (scope IN ('all', 'groups')),

    CONSTRAINT fk_assignments_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
);

CREATE TABLE assignment_groups (
    id BIGSERIAL PRIMARY KEY,
    assignment_id BIGINT NOT NULL,
    group_id BIGINT NOT NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_assignment_groups_assignment
        FOREIGN KEY (assignment_id)
        REFERENCES assignments(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_assignment_groups_group
        FOREIGN KEY (group_id)
        REFERENCES groups(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_assignment_group
        UNIQUE (assignment_id, group_id)
);

CREATE TABLE submissions (
    id BIGSERIAL PRIMARY KEY,
    assignment_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    group_id BIGINT,
    confirmed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_submissions_assignment
        FOREIGN KEY (assignment_id)
        REFERENCES assignments(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_submissions_student
        FOREIGN KEY (student_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_submissions_group
        FOREIGN KEY (group_id)
        REFERENCES groups(id)
        ON DELETE SET NULL,

    CONSTRAINT unique_student_submission
        UNIQUE (assignment_id, student_id)
);


CREATE INDEX idx_users_email
    ON users(email);

CREATE INDEX idx_users_student_id
    ON users(student_id);

CREATE INDEX idx_group_members_group
    ON group_members(group_id);

CREATE INDEX idx_group_members_student
    ON group_members(student_id);

CREATE INDEX idx_assignments_due_date
    ON assignments(due_date);

CREATE INDEX idx_assignment_groups_assignment
    ON assignment_groups(assignment_id);

CREATE INDEX idx_assignment_groups_group
    ON assignment_groups(group_id);

CREATE INDEX idx_submissions_assignment
    ON submissions(assignment_id);

CREATE INDEX idx_submissions_student
    ON submissions(student_id);

CREATE INDEX idx_submissions_group
    ON submissions(group_id);