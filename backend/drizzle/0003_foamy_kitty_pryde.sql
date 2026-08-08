-- Create money_requests table
CREATE TABLE IF NOT EXISTS money_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES customers(id),
    receiver_id UUID NOT NULL REFERENCES customers(id),
    amount VARCHAR(50) NOT NULL,
    currency VARCHAR(10) DEFAULT 'SLE' NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'PENDING' NOT NULL,
    expires_at TIMESTAMP,
    accepted_at TIMESTAMP,
    rejected_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for money_requests
CREATE INDEX IF NOT EXISTS money_requests_requester_id_idx ON money_requests(requester_id);
CREATE INDEX IF NOT EXISTS money_requests_receiver_id_idx ON money_requests(receiver_id);
CREATE INDEX IF NOT EXISTS money_requests_status_idx ON money_requests(status);
CREATE INDEX IF NOT EXISTS money_requests_created_at_idx ON money_requests(created_at);