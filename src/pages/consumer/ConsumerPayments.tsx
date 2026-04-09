import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Download, CreditCard, Check, AlertCircle, RefreshCw, Plus } from "lucide-react";
import { usePayment } from "@/hooks/usePayment";
import { useStripeElementsHook } from "@/hooks/useStripePayment";
import { toast } from "sonner";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Initialize Stripe
const STRIPE_PUBLISHABLE_KEY = "pk_test_51RESJw08pUL5sho71d22vUhkejAqylfWOoIuTYiLhV1Q1IvRleSOlECb1gWYDnOU4fmnuXOZdiWTa0H3VbL8kRHb001A18IOzT";
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// Status icon mapping
const statusIcons = {
  successful: <Check className="h-4 w-4 text-green-500" />,
  failed: <AlertCircle className="h-4 w-4 text-red-500" />,
  refunded: <RefreshCw className="h-4 w-4 text-amber-500" />,
  pending: <Clock className="h-4 w-4 text-yellow-500" />
};

// Status badge variants
const statusVariants = {
  successful: "success",
  failed: "destructive",
  refunded: "warning",
  pending: "warning"
};

// Stripe Payment Component that uses Elements context
const TestPaymentForm = ({ amount, bookingId, serviceType, onSuccess }: { 
  amount: number, 
  bookingId: string, 
  serviceType: string,
  onSuccess: () => void
}) => {
  const { processPayment, isLoading: isProcessingPayment } = usePayment();
  const { handlePayment, processing: isConfirmingPayment, error } = useStripeElementsHook();
  const [sliderValue, setSliderValue] = useState(amount);
  
  const handleTestPayment = async () => {
    try {
      console.log(`Processing test payment for ${amount} cents`);
      
      // Create a payment intent
      const { success, clientSecret } = await processPayment({
        amount: sliderValue / 100, // Convert from cents to actual amount
        bookingId,
        serviceType,
        currency: "inr"
      });

      if (!success || !clientSecret) {
        toast.error("Failed to create payment intent");
        return;
      }

      console.log("Client secret received:", clientSecret);
      
      // Process the payment with Stripe
      const paymentSuccess = await handlePayment(clientSecret);
      
      if (paymentSuccess) {
        toast.success("Payment processed successfully");
        onSuccess();
      } else {
        toast.error("Payment failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Payment processing failed");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">
          Test Amount (₹{(sliderValue / 100).toFixed(2)})
        </label>
        <input 
          type="range" 
          min="5000" 
          max="50000" 
          step="1000"
          value={sliderValue}
          onChange={(e) => setSliderValue(Number(e.target.value))}
          className="w-full mt-2"
        />
      </div>
      <Button 
        onClick={handleTestPayment} 
        disabled={isProcessingPayment || isConfirmingPayment}
        className="w-full"
      >
        {(isProcessingPayment || isConfirmingPayment) ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
            Processing...
          </>
        ) : (
          `Pay ₹${(sliderValue / 100).toFixed(2)}`
        )}
      </Button>
      {error && <div className="text-red-500 text-sm">{error}</div>}
    </div>
  );
};

const ConsumerPayments = () => {
  const [showPayment, setShowPayment] = useState(false);
  const [testAmount, setTestAmount] = useState(10000); // 100.00 in cents
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      loadPayments();
    }
  }, [user]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      // Fetch bookings to infer payment history
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('consumer_id', user!.id)
        .in('booking_status', ['completed', 'cancelled'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mappedPayments = (data || []).map(b => ({
        id: b.id,
        serviceType: b.service_type,
        date: new Date(b.date_time).toLocaleDateString(),
        time: new Date(b.date_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        amount: b.price_estimate || 0,
        paymentMethod: b.payment_method || (b.booking_status === 'cancelled' ? 'None' : 'Card'),
        status: b.booking_status === 'cancelled' ? 'refunded' : (b.payment_status === 'successful' ? 'successful' : 'pending'),
        receiptUrl: null
      }));
      
      setPayments(mappedPayments);
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const icon = statusIcons[status as keyof typeof statusIcons] || null;
    const variant = statusVariants[status as keyof typeof statusVariants] || "default";
    
    return (
      <Badge variant={variant as any} className="flex items-center gap-1">
        {icon}
        <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </Badge>
    );
  };

  return (
    <DashboardLayout userType="consumer">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Payments</h1>
            <p className="text-gray-600">View your payment history and receipts.</p>
          </div>
          <Button 
            onClick={() => setShowPayment(!showPayment)}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Test Payment
          </Button>
        </div>

        {showPayment && (
          <Card>
            <CardHeader>
              <CardTitle>Process Test Payment</CardTitle>
              <CardDescription>Use this form to test the payment system</CardDescription>
            </CardHeader>
            <CardContent>
              <Elements stripe={stripePromise}>
                <TestPaymentForm 
                  amount={testAmount} 
                  bookingId={`test-booking-${Date.now()}`} 
                  serviceType="test-payment"
                  onSuccess={() => {
                    setShowPayment(false);
                    toast.success("Test payment completed successfully!");
                    loadPayments(); // Reload after test payment
                  }}
                />
              </Elements>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><p>Loading payments...</p></div>
            ) : payments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <CreditCard className="h-10 w-10 text-gray-300 mb-4" />
                <p className="text-lg text-gray-500">No payment history found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Service</th>
                      <th className="text-left py-3 px-4">Date & Time</th>
                      <th className="text-left py-3 px-4">Amount</th>
                      <th className="text-left py-3 px-4">Method</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-right py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b">
                        <td className="py-3 px-4">
                          {payment.serviceType}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Clock size={14} />
                            <span>{payment.date} {payment.time}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium">
                          ₹{payment.amount.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <CreditCard size={14} className="text-gray-500" />
                            <span>{payment.paymentMethod}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(payment.status)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button variant="ghost" size="sm" className="h-8 gap-1">
                            <Download size={14} />
                            Receipt
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-dashed rounded-lg p-4 flex items-center justify-center">
                <Button variant="outline">Add Payment Method</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ConsumerPayments;
