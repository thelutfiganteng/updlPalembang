-- Create users table
CREATE TABLE IF NOT EXISTS users (
  email TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  name TEXT NOT NULL,
  nip TEXT,
  birth_date TIMESTAMP WITH TIME ZONE,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  barcode TEXT NOT NULL
);

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('material', 'tool', 'apd')),
  quantity INTEGER NOT NULL,
  available INTEGER NOT NULL,
  image TEXT,
  added_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  description TEXT,
  barcode TEXT NOT NULL,
  brand TEXT,
  year INTEGER,
  unit TEXT,
  location TEXT,
  condition TEXT,
  tool_number TEXT,
  serial_number TEXT,
  last_calibration TIMESTAMP WITH TIME ZONE,
  next_calibration TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  measuring_tool_number TEXT,
  sop TEXT,
  usage_period TEXT
);

-- Create borrow_records table
CREATE TABLE IF NOT EXISTS borrow_records (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES inventory_items(id),
  user_email TEXT NOT NULL REFERENCES users(email),
  borrow_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  return_date TIMESTAMP WITH TIME ZONE,
  quantity INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'returned')),
  estimated_duration INTEGER NOT NULL,
  barcode TEXT NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_type ON inventory_items(type);
CREATE INDEX IF NOT EXISTS idx_borrow_records_user_email ON borrow_records(user_email);
CREATE INDEX IF NOT EXISTS idx_borrow_records_status ON borrow_records(status);
CREATE INDEX IF NOT EXISTS idx_borrow_records_item_id ON borrow_records(item_id);
