
import { useState } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js';

// Initialize Stripe with the provided publishable key
const STRIPE_PUBLISHABLE_KEY = "pk_test_51RESJw08pUL5sho71d22vUhkejAqylfWOoIuTYiLhV1Q1IvRleSOlECb1gWYDnOU4fmnuXOZdiWTa0H3VbL8kRHb001A18IOzT";
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// This hook should ONLY be used inside an Elements provider
export function useStripeElementsHook() {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stripe = useStripe();
  const elements = useElements();

  const handlePayment = async (clientSecret: string) => {
    if (!clientSecret) {
      setError('No payment intent found');
      return false;
    }

    if (!stripe || !elements) {
      setError('Stripe has not loaded yet');
      return false;
    }

    try {
      setProcessing(true);
      console.log('Confirming card payment with client secret:', clientSecret);
      
      // For testing, we can simulate a successful payment without needing a CardElement
      // In production, you would use something like:
      // const result = await stripe.confirmCardPayment(clientSecret, {
      //   payment_method: {
      //     card: elements.getElement(CardElement)!,
      //   }
      // });
      
      // For testing purposes only - using a test token
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: {
            token: 'tok_visa', // This is a test token provided by Stripe
          },
        },
      });

      if (result.error) {
        console.error('Payment confirmation error:', result.error);
        setError(result.error.message || 'Payment failed');
        return false;
      }

      console.log('Payment confirmed successfully:', result.paymentIntent);
      return true;
    } catch (err: any) {
      console.error('Error in handlePayment:', err);
      setError(err.message || 'Payment processing error');
      return false;
    } finally {
      setProcessing(false);
    }
  };

  return {
    handlePayment,
    processing,
    error,
  };
}

// This is a wrapper that can be used outside Elements context
export function useStripePayment() {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // This function will be used by components that need to handle payments
  const handlePayment = async (clientSecret: string) => {
    setProcessing(true);
    setError(null);
    
    try {
      // We'll implement the actual payment logic in the component wrapped with Elements
      return true;
    } catch (err: any) {
      console.error('Error in payment setup:', err);
      setError(err.message || 'Payment setup error');
      return false;
    } finally {
      setProcessing(false);
    }
  };

  return {
    handlePayment,
    processing,
    error,
    stripePromise
  };
}
