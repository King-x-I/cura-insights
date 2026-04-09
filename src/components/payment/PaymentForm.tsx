
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LoaderCircle, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PaymentFormProps {
  bookingId: string;
  amount: number;
  serviceType: string;
  onPaymentSuccess?: () => void;
  onPaymentFailure?: () => void;
}

export function PaymentForm({ 
  bookingId, 
  amount, 
  serviceType, 
  onPaymentSuccess, 
  onPaymentFailure 
}: PaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePayment = async () => {
    setIsLoading(true);
    setPaymentStatus('processing');
    setErrorMessage(null);

    try {
      // Create a payment intent on the server
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount,
          bookingId,
          serviceType
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to create payment intent');
      }

      if (!data?.clientSecret) {
        throw new Error('No client secret returned from the server');
      }

      // In a real implementation, you would open the Stripe checkout here
      // For demo purposes, we'll simulate a successful payment
      setTimeout(() => {
        setPaymentStatus('success');
        setIsLoading(false);
        
        // Update booking payment status in database (in a real app, this would be done via webhook)
        const updateBooking = async () => {
          try {
            await supabase
              .from('bookings')
              .update({
                payment_status: 'completed',
                updated_at: new Date().toISOString()
              })
              .eq('id', bookingId);
              
            // Send payment receipt email
            await supabase.functions.invoke('send-email', {
              body: {
                to: 'customer@example.com', // In a real app, get this from the user's profile
                subject: 'Payment Receipt - Cura',
                templateName: 'payment-receipt',
                templateData: {
                  userName: 'User', // In a real app, get this from the user's profile
                  transactionId: `TX-${Date.now()}`, // In a real app, get this from the payment provider
                  serviceType,
                  amount,
                  paymentDate: new Date().toLocaleDateString(),
                  paymentMethod: 'Card', // In a real app, get this from the payment provider
                  bookingId,
                }
              }
            });
            
            toast.success('Payment successful!');
            if (onPaymentSuccess) onPaymentSuccess();
          } catch (err) {
            console.error('Error updating booking payment status:', err);
          }
        };
        
        updateBooking();
      }, 2000);

    } catch (error: any) {
      console.error('Payment error:', error);
      setPaymentStatus('error');
      setErrorMessage(error.message || 'An error occurred during payment processing');
      setIsLoading(false);
      if (onPaymentFailure) onPaymentFailure();
      toast.error('Payment failed');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Payment</CardTitle>
        <CardDescription>
          Pay securely for your {serviceType} service
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Service Type</span>
            <span className="font-medium">{serviceType}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Booking ID</span>
            <span className="font-mono text-xs">{bookingId}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="font-medium">Total Amount</span>
            <span className="text-lg font-bold">₹{amount.toFixed(2)}</span>
          </div>
        </div>

        {paymentStatus === 'success' && (
          <Alert className="bg-green-50 text-green-800 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>Payment Successful</AlertTitle>
            <AlertDescription>
              Your payment has been processed successfully. A receipt has been sent to your email.
            </AlertDescription>
          </Alert>
        )}

        {paymentStatus === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Payment Failed</AlertTitle>
            <AlertDescription>
              {errorMessage || 'There was an error processing your payment. Please try again.'}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        {paymentStatus === 'idle' || paymentStatus === 'error' ? (
          <Button 
            className="w-full" 
            onClick={handlePayment} 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Processing
              </>
            ) : 'Pay Now'}
          </Button>
        ) : paymentStatus === 'processing' ? (
          <Button className="w-full" disabled>
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment
          </Button>
        ) : (
          <Button className="w-full" variant="outline" onClick={onPaymentSuccess}>
            Continue
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
