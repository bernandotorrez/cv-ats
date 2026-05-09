-- =====================================================
-- Payments Table for Payment Webhook
-- Created: 2026-05-08
-- Purpose: Store payment records for subscription management
-- Security: RLS enabled with user-scoped policies
-- =====================================================

-- Enable pgcrypto extension for UUID generation (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    gateway TEXT NOT NULL DEFAULT 'midtrans',
    gateway_order_id TEXT UNIQUE NOT NULL,
    gateway_transaction_id TEXT,
    amount_idr INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'expired', 'cancelled')),
    payment_method TEXT,
    invoice_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only view their own payments
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

-- NOTE: INSERT/UPDATE/DELETE are handled exclusively by:
-- 1. payment-webhook Edge Function (service_role)
-- 2. Admin panel (service_role)
-- Users cannot create/modify payment records directly.

-- Indexes for performance
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_gateway_order_id ON public.payments(gateway_order_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_created_at ON public.payments(created_at DESC);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE public.payments IS 'Stores payment records for subscription management';
COMMENT ON COLUMN public.payments.gateway IS 'Payment gateway used (midtrans, xendit, etc.)';
COMMENT ON COLUMN public.payments.gateway_order_id IS 'Unique order ID from payment gateway';
COMMENT ON COLUMN public.payments.gateway_transaction_id IS 'Transaction ID from payment gateway';
COMMENT ON COLUMN public.payments.status IS 'Payment status: pending, success, failed, expired, cancelled';
