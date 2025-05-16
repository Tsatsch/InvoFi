CREATE TABLE public.invoices (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    invoice_number text NOT NULL,
    issue_date date NOT NULL DEFAULT CURRENT_DATE,
    due_date date NULL,
    sender_name text NOT NULL,
    sender_company text NULL,
    sender_address text NULL,
    sender_email text NULL,
    sender_phone text NULL,
    sender_vat_id text NULL,
    sender_reg_number text NULL,
    recipient_name text NOT NULL,
    recipient_company text NULL,
    recipient_address text NULL,
    recipient_email text NULL,
    recipient_vat_id text NULL,
    items jsonb NOT NULL,
    bank_name text NULL,
    account_number text NULL,
    bic_swift text NULL,
    tax_rate numeric NOT NULL DEFAULT 0,
    notes text NULL,
    currency text NOT NULL DEFAULT 'USD'::text,
    subtotal_amount numeric NOT NULL DEFAULT 0,
    total_amount numeric NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'draft'::text,
    onchain_tx_id text NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT invoices_pkey PRIMARY KEY (id),
    CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number),
    CONSTRAINT invoices_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Optional: Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Reminder for RLS policies (these are examples and need to be adapted)
-- You need to enable RLS on the table first in Supabase Studio.

-- Example: Allow authenticated users to insert their own invoices
CREATE POLICY "Allow users to insert their own invoices"
ON public.invoices
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Example: Allow users to select their own invoices
CREATE POLICY "Allow users to select their own invoices"
ON public.invoices
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Example: Allow users to update their own invoices
CREATE POLICY "Allow users to update their own invoices"
ON public.invoices
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Example: Allow users to delete their own draft invoices (optional)
-- CREATE POLICY "Allow users to delete their own draft invoices"
-- ON public.invoices
-- FOR DELETE
-- TO authenticated
-- USING (auth.uid() = user_id AND status = 'draft');

COMMENT ON TABLE public.invoices IS 'Stores invoice data before onchain processing';
COMMENT ON COLUMN public.invoices.user_id IS 'Foreign Key to auth.users.id, identifies the creator';
COMMENT ON COLUMN public.invoices.items IS 'Array of invoice line items, e.g., [{ "description": "Item 1", "quantity": 1, "unitPrice": 100 }]';
COMMENT ON COLUMN public.invoices.tax_rate IS 'Percentage tax rate, e.g., 20 for 20%';
COMMENT ON COLUMN public.invoices.status IS 'Lifecycle status of the invoice (e.g., draft, pending_approval, approved, tokenized)'; 