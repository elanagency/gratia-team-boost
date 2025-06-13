
-- Create a table to store cart information
CREATE TABLE public.carts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rye_cart_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  reward_id UUID NOT NULL,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  buyer_identity JSONB NOT NULL,
  cart_cost JSONB,
  status TEXT NOT NULL DEFAULT 'created',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Foreign key relationships
  CONSTRAINT fk_carts_reward_id FOREIGN KEY (reward_id) REFERENCES public.rewards(id),
  CONSTRAINT fk_carts_company_id FOREIGN KEY (company_id) REFERENCES public.companies(id)
);

-- Add Row Level Security
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;

-- Create policies for cart access
CREATE POLICY "Users can view carts from their company" 
  ON public.carts 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.company_members 
      WHERE company_id = carts.company_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert carts" 
  ON public.carts 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "System can update carts" 
  ON public.carts 
  FOR UPDATE 
  USING (true);

-- Create index for better performance
CREATE INDEX idx_carts_rye_cart_id ON public.carts(rye_cart_id);
CREATE INDEX idx_carts_user_id ON public.carts(user_id);
CREATE INDEX idx_carts_company_id ON public.carts(company_id);
CREATE INDEX idx_carts_status ON public.carts(status);
