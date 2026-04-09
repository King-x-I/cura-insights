import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CancelPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-red-500">
        <CardHeader className="text-center pt-8 pb-4">
          <div className="flex justify-center mb-4">
            <XCircle className="h-20 w-20 text-red-500" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">Payment Cancelled ❌</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-lg text-gray-600">
            You successfully cancelled your checkout session. No charges were made to your account.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pb-8 pt-4">
          <Button 
            className="w-full h-12 text-md font-medium" 
            variant="outline"
            onClick={() => navigate('/payment-demo')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Try Again
          </Button>
          <Button 
            className="w-full h-12 text-md font-medium" 
            variant="ghost"
            onClick={() => navigate('/')}
          >
            Return to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CancelPage;
