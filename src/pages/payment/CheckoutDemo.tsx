import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { loadStripe } from '@stripe/stripe-js';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const STRIPE_PUBLISHABLE_KEY = "pk_test_51RESJw08pUL5sho71d22vUhkejAqylfWOoIuTYiLhV1Q1IvRleSOlECb1gWYDnOU4fmnuXOZdiWTa0H3VbL8kRHb001A18IOzT";
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const CheckoutDemo = () => {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setLoading(true);
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${API_URL}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 10000, // ₹100 in paise
          currency: 'inr',
          productName: "CURA Service"
        }),
      });

      const { data, error } = await response.json();

      if (error) {
        throw new Error(error.message || 'Failed to initialize checkout');
      }

      if (data?.sessionId) {
        const stripe = await stripePromise;
        if (stripe) {
          // Redirect the user to standard Stripe Checkout
          const { error: stripeError } = await stripe.redirectToCheckout({
            sessionId: data.sessionId,
          });

          if (stripeError) {
            throw new Error(stripeError.message);
          }
        }
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error(err.message || 'Failed to start payment processing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-indigo-600">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold">CURA Payments</CardTitle>
          <CardDescription>
            Seamless external checkout testing
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 pb-6 text-center">
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-6 mb-4">
            <h3 className="text-lg font-semibold text-indigo-900 mb-1">CURA Service Package</h3>
            <p className="text-sm text-indigo-500 mb-4">Standard Rate</p>
            <div className="text-4xl font-bold text-indigo-700">₹100</div>
          </div>
          <p className="text-sm text-gray-500 px-4">
            You will be temporarily redirected to Stripe's hosted payment gateway to securely submit your card details.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button 
            className="w-full h-12 text-lg font-semibold bg-indigo-600 hover:bg-indigo-700" 
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Redirecting to Stripe...</>
            ) : (
              "Pay ₹100"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CheckoutDemo;
