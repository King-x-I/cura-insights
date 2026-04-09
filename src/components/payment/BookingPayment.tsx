
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, CreditCard, Wallet, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { usePayment } from '@/hooks/usePayment';
import { useStripeElementsHook } from '@/hooks/useStripePayment';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Initialize Stripe with the provided publishable key
const STRIPE_PUBLISHABLE_KEY = "pk_test_51RESJw08pUL5sho71d22vUhkejAqylfWOoIuTYiLhV1Q1IvRleSOlECb1gWYDnOU4fmnuXOZdiWTa0H3VbL8kRHb001A18IOzT";
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

interface BookingPaymentProps {
  bookingId: string;
  serviceType: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// PaymentProcessor component that uses Elements context
const PaymentProcessor = ({
  bookingId, 
  serviceType,
  amount, 
  paymentMethod,
  onSuccess,
}: { 
  bookingId: string;
  serviceType: string;
  amount: number;
  paymentMethod: string;
  onSuccess: () => void;
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { processPayment } = usePayment();
  const { handlePayment, processing: stripeProcessing, error } = useStripeElementsHook();

  useEffect(() => {
    if (error) {
      console.error("Stripe payment error:", error);
    }
  }, [error]);

  const handlePaymentProcess = async () => {
    try {
      setIsProcessing(true);
      console.log(`Processing ${paymentMethod} payment for booking ${bookingId} with amount ${amount}`);
      
      // Create a payment intent
      const { success, clientSecret } = await processPayment({
        amount: amount / 100, // Convert back from cents to actual amount
        bookingId,
        serviceType,
        paymentMethod,
        currency: 'inr'
      });
      
      if (!success || !clientSecret) {
        throw new Error('Failed to create payment intent');
      }
      
      console.log("Client secret received:", clientSecret);
      
      // Process the payment with Stripe
      const paymentSuccess = await handlePayment(clientSecret);
      
      if (paymentSuccess) {
        console.log('Payment successful');
        toast.success('Payment processed successfully!');
        onSuccess();
      } else {
        throw new Error('Payment confirmation failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button 
      className="w-full" 
      onClick={handlePaymentProcess}
      disabled={isProcessing || stripeProcessing}
    >
      {(isProcessing || stripeProcessing) ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        `Pay ${new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR'
        }).format(amount / 100)}`
      )}
    </Button>
  );
};

export function BookingPayment({
  bookingId,
  serviceType,
  amount,
  customerName,
  customerEmail,
  onSuccess,
  onCancel
}: BookingPaymentProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  
  useEffect(() => {
    // Log to verify the component is receiving correct props
    console.log('BookingPayment received props:', {
      bookingId,
      serviceType,
      amount,
      customerName,
      customerEmail
    });
  }, [bookingId, serviceType, amount, customerName, customerEmail]);

  // Format the price for display
  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount / 100);

  return (
    <Elements stripe={stripePromise}>
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Complete Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-medium">Order Summary</h3>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600 capitalize">{serviceType.replace(/-/g, ' ')}</span>
              <span>{formattedPrice}</span>
            </div>
            <div className="flex justify-between py-2 font-medium">
              <span>Total</span>
              <span>{formattedPrice}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">Payment Method</h3>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
              <div className="flex items-center space-x-2 border p-3 rounded-md">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer w-full">
                  <CreditCard className="h-5 w-5 text-blue-500" />
                  <span>Credit/Debit Card</span>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 border p-3 rounded-md">
                <RadioGroupItem value="wallet" id="wallet" />
                <Label htmlFor="wallet" className="flex items-center gap-2 cursor-pointer w-full">
                  <Wallet className="h-5 w-5 text-green-500" />
                  <span>Digital Wallet</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Customer Information</h3>
            <div className="text-sm">
              <div><span className="font-medium">Name:</span> {customerName}</div>
              <div><span className="font-medium">Email:</span> {customerEmail}</div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <PaymentProcessor 
            bookingId={bookingId}
            serviceType={serviceType}
            amount={amount} 
            paymentMethod={paymentMethod}
            onSuccess={onSuccess}
          />
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center gap-1"
            onClick={onCancel}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </CardFooter>
      </Card>
    </Elements>
  );
}
