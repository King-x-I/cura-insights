import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SuccessPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-green-500">
        <CardHeader className="text-center pt-8 pb-4">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-20 w-20 text-green-500" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">Payment Successful ✅</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-lg text-gray-600">
            Thank you for your payment! Your transaction has been securely processed by Stripe.
          </p>
          <div className="mt-8 bg-white border border-gray-200 rounded-lg p-4 text-left shadow-sm">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Order Details</h4>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-700">Service</span>
              <span className="font-medium text-gray-900">CURA Service</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-700">Amount Paid</span>
              <span className="font-bold text-gray-900">₹100</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pb-8 pt-4">
          <Button 
            className="w-full h-12 text-md font-medium" 
            onClick={() => navigate('/')}
          >
            <Home className="mr-2 h-4 w-4" /> Return to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SuccessPage;
