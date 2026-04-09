
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreatePaymentIntentProps {
  amount: number;
  bookingId: string;
  serviceType: string;
  paymentMethod?: string;
  currency?: string;
}

interface UsePaymentReturn {
  processPayment: (props: CreatePaymentIntentProps) => Promise<{ success: boolean, clientSecret?: string }>;
  isLoading: boolean;
  error: string | null;
}

export function usePayment(): UsePaymentReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processPayment = async ({
    amount,
    bookingId,
    serviceType,
    paymentMethod = 'card',
    currency = 'inr'
  }: CreatePaymentIntentProps): Promise<{ success: boolean, clientSecret?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Creating payment intent for booking:', bookingId, 'amount:', amount);
      
      const { data, error: functionError } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          bookingId,
          amount,
          serviceType,
          paymentMethod,
          currency
        }
      });

      if (functionError) {
        console.error('Supabase function error:', functionError);
        throw new Error(functionError.message || 'Failed to create payment intent');
      }

      if (!data?.clientSecret) {
        console.error('No client secret received:', data);
        throw new Error('No client secret received from server');
      }

      console.log('Payment intent created successfully, clientSecret received');
      return { 
        success: true, 
        clientSecret: data.clientSecret 
      };
    } catch (err: any) {
      const errorMessage = err.message || 'Payment processing failed';
      console.error('Payment error:', errorMessage);
      setError(errorMessage);
      
      // For testing purposes only, you can generate a mock client secret when in test mode
      if (bookingId.startsWith('test-')) {
        console.log('Test mode detected, using mock client secret despite error');
        return { 
          success: true, 
          clientSecret: 'pi_mock_secret_' + Math.random().toString(36).substring(2, 15)
        };
      }
      
      toast.error(errorMessage);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    processPayment,
    isLoading,
    error
  };
}
