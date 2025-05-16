-- Attempt to insert a seed user if it doesn't exist (for FK purposes primarily).
-- This user is NOT intended for direct login via Supabase auth flows without proper GoTrue registration.
-- Its main purpose here is to provide a valid UUID for the user_id foreign key in the seeded invoice.
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'seed.user@example.com', '$2a$10$abcdefghijklmnopqrstuv', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Seed a sample invoice
INSERT INTO public.invoices (
  user_id,
  invoice_number,
  issue_date,
  due_date,
  sender_name,
  sender_company,
  sender_address,
  sender_email,
  recipient_name,
  recipient_company,
  recipient_address,
  recipient_email,
  items,
  bank_name,
  account_number,
  currency,
  subtotal_amount,
  tax_rate,
  total_amount,
  status,
  notes
)
VALUES (
  '00000000-0000-0000-0000-000000000001', -- Corresponds to the seed user ID above
  'SEED-001',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  '2UBUzdkZZSZaEJiWNwmXQPjRA8iVL2H8okwL8K5BsbrU', -- SETTING SENDER_NAME TO THE WALLET ADDRESS
  'Seed Company Inc.',
  '123 Seed Street, Data City',
  'sender.seed@example.com',
  'Recipient LLC',
  'Client Solutions Ltd.',
  '456 Client Avenue, Testville',
  'recipient.seed@example.com',
  '[{"description": "Consulting Services", "quantity": 10, "unitPrice": 150}, {"description": "Software License", "quantity": 1, "unitPrice": 500}]', -- Sample items
  'Global Seed Bank',
  'ACC123456789',
  'USD',
  2000.00, -- 10*150 + 1*500 = 1500 + 500
  10,      -- 10% tax
  2200.00, -- 2000 * 1.10
  'APPROVED_FOR_TOKENIZATION', -- CHANGED STATUS
  'This is a sample invoice seeded at startup. Wallet: 2UBUzdkZZSZaEJiWNwmXQPjRA8iVL2H8okwL8K5BsbrU'
); 