-- PCB Anomaly Detection - Initial Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS analyses (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    filename VARCHAR(255) NOT NULL,
    original_path VARCHAR(500),
    annotated_path VARCHAR(500),
    annotated_image_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending',
    model_used VARCHAR(50),
    confidence_threshold FLOAT DEFAULT 0.5,
    processing_time FLOAT,
    overall_confidence FLOAT,
    image_width INTEGER,
    image_height INTEGER,
    total_defects INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS defects (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    analysis_id VARCHAR(36) REFERENCES analyses(id) ON DELETE CASCADE,
    defect_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20),
    confidence FLOAT,
    bbox_x FLOAT,
    bbox_y FLOAT,
    bbox_w FLOAT,
    bbox_h FLOAT,
    location_label VARCHAR(200),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title VARCHAR(255),
    report_type VARCHAR(50),
    file_path VARCHAR(500),
    file_size INTEGER,
    analysis_count INTEGER,
    pass_rate FLOAT,
    date_from TIMESTAMPTZ,
    date_to TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);
CREATE INDEX IF NOT EXISTS idx_defects_analysis_id ON defects(analysis_id);
CREATE INDEX IF NOT EXISTS idx_defects_type ON defects(defect_type);
