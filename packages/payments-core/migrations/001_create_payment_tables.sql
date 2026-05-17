-- payment_transaction_logs
CREATE TABLE IF NOT EXISTS payment_transaction_logs (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(64) NOT NULL,
  idempotency_key VARCHAR(255) UNIQUE NOT NULL,
  correlation_id VARCHAR(255),
  status VARCHAR(64) NOT NULL,
  amount NUMERIC(20,2) DEFAULT 0,
  currency VARCHAR(8) DEFAULT 'USD',
  metadata JSONB DEFAULT '{}',
  provider_reference VARCHAR(255),
  checkout_url TEXT,
  provider_payload JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- payment_provider_events
CREATE TABLE IF NOT EXISTS payment_provider_events (
  id SERIAL PRIMARY KEY,
  transaction_id VARCHAR(255),
  provider VARCHAR(64) NOT NULL,
  event_type VARCHAR(128) NOT NULL,
  payload JSONB DEFAULT '{}',
  correlation_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- payment_reconciliation_runs
CREATE TABLE IF NOT EXISTS payment_reconciliation_runs (
  id SERIAL PRIMARY KEY,
  run_id VARCHAR(255) UNIQUE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  finished_at TIMESTAMP WITH TIME ZONE,
  summary JSONB DEFAULT '{}'
);
