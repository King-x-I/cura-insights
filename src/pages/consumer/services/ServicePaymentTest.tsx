
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookingPayment } from '@/components/payment/BookingPayment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const ServicePaymentTest = () => {
  const { user } = useAuth();
  const [showPayment, setShowPayment] = useState(false);
  const [amount, setAmount] = useState<number>(499);
  const [serviceType, setServiceType] = useState<string>('driver');
  
  useEffect(() => {
    console.log("ServicePaymentTest mounted, user:", user);
  }, [user]);
  
  // Generate a random booking ID for testing
  const testBookingId = `test-${Math.random().toString(36).substring(2, 9)}`;
  
  const handleStartPayment = () => {
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    console.log(`Starting payment process for amount: ${amount}`);
    setShowPayment(true);
  };
  
  return (
    <DashboardLayout userType="consumer">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Payment Testing</h1>
          <p className="text-gray-500">Test the payment functionality with custom parameters</p>
        </div>
        
        {showPayment ? (
          <div className="max-w-md mx-auto">
            <BookingPayment
              bookingId={testBookingId}
              serviceType={serviceType}
              amount={amount * 100} // Convert to cents for Stripe
              customerName={user?.email?.split('@')[0] || 'Test User'}
              customerEmail={user?.email || 'test@example.com'}
              onSuccess={() => {
                toast.success('Payment successful!');
                setShowPayment(false);
              }}
              onCancel={() => setShowPayment(false)}
            />
            
            <div className="mt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowPayment(false)}
                className="w-full"
              >
                Go Back
              </Button>
            </div>
          </div>
        ) : (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Test Payment</CardTitle>
              <CardDescription>Configure a test payment to verify the payment flow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="Enter amount in rupees"
                  min="1"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="service-type">Service Type</Label>
                <Select 
                  value={serviceType} 
                  onValueChange={setServiceType}
                >
                  <SelectTrigger id="service-type">
                    <SelectValue placeholder="Select a service type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="driver">Driver</SelectItem>
                    <SelectItem value="nanny">Nanny</SelectItem>
                    <SelectItem value="caretaker">Caretaker</SelectItem>
                    <SelectItem value="chef">Chef</SelectItem>
                    <SelectItem value="house-helper">House Helper</SelectItem>
                    <SelectItem value="parcel-delivery">Parcel Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={handleStartPayment} 
                className="w-full mt-4"
              >
                Start Payment Process
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ServicePaymentTest;
