-- Database Schema for KutumbSetu - Beneficiary Management System

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    mobile VARCHAR(15) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('CITIZEN', 'OFFICER', 'ADMIN')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE officers (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(100) UNIQUE NOT NULL,
    department VARCHAR(255) NOT NULL,
    designation VARCHAR(255) NOT NULL,
    village VARCHAR(255) NOT NULL,
    taluka VARCHAR(255) NOT NULL,
    district VARCHAR(255) NOT NULL,
    verification_status VARCHAR(50) DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED'))
);

CREATE SEQUENCE IF NOT EXISTS family_id_seq START 1000;

CREATE TABLE families (
    id SERIAL PRIMARY KEY,
    family_id VARCHAR(100) UNIQUE NOT NULL, -- e.g., GJ-FAM-2026-001024
    head_member_id INT, -- Will be a foreign key to family_members, nullable initially until members are added
    annual_income DECIMAL(12, 2) NOT NULL,
    caste VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    village VARCHAR(255) NOT NULL,
    taluka VARCHAR(255) NOT NULL,
    district VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED')),
    created_by INT UNIQUE NOT NULL REFERENCES users(id),
    verified_by INT REFERENCES users(id),
    verified_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE family_members (
    id SERIAL PRIMARY KEY,
    family_id INT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(50) NOT NULL,
    relationship VARCHAR(100) NOT NULL,
    occupation VARCHAR(255),
    is_student BOOLEAN DEFAULT FALSE,
    is_parent_alive BOOLEAN
);

-- Add foreign key constraint for head_member_id in families table
ALTER TABLE families ADD CONSTRAINT fk_head_member FOREIGN KEY (head_member_id) REFERENCES family_members(id) ON DELETE SET NULL;

CREATE TABLE schemes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    criteria JSONB, -- Storing rules/criteria flexibly as JSON
    required_documents JSONB, -- Storing required documents as JSON array
    source VARCHAR(255), -- Official source URL or reference
    created_by INT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE benefit_requests (
    id SERIAL PRIMARY KEY,
    family_id INT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    scheme_id INT NOT NULL REFERENCES schemes(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'UNDER_REVIEW' CHECK (status IN ('UNDER_REVIEW', 'APPROVED', 'REJECTED')),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by INT REFERENCES users(id),
    reviewed_at TIMESTAMP,
    rejection_reason TEXT,
    UNIQUE(family_id, scheme_id)
);

CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    family_id INT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    document_type VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'VERIFIED', 'REJECTED'))
);
