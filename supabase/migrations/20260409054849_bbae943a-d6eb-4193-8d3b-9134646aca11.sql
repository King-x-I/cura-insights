
-- Fix overly permissive notification insert policy
DROP POLICY "System can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert own notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Fix overly permissive payment insert policy  
DROP POLICY "System can insert payments" ON public.payments;
CREATE POLICY "Users can insert own payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);
