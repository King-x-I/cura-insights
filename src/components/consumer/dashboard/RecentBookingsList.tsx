
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookingStatus } from '@/hooks/useBookingFlow';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { History, CheckCircle2, XCircle, DollarSign, Clock } from 'lucide-react';
import { getStatusBadge } from './ActiveBookingsList';
import { Badge } from '@/components/ui/badge';

export interface RecentBookingsListProps {
  bookings: any[];
}

export function RecentBookingsList({ bookings }: RecentBookingsListProps) {
  const navigate = useNavigate();

  if (bookings.length === 0) return null;

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Payment Pending</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Recent Bookings</h2>
        <Button 
          variant="outline" 
          className="flex items-center gap-2" 
          onClick={() => navigate('/consumer/history')}
        >
          <History size={16} />
          View History
        </Button>
      </div>
      <div className="grid gap-4">
        {bookings.map((booking) => (
          <Card key={booking.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium capitalize">{booking.service_type?.replace(/-/g, ' ')}</h3>
                    {getStatusBadge(booking.booking_status)}
                    {booking.payment_status && getPaymentStatusBadge(booking.payment_status)}
                  </div>
                  
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <Clock size={14} />
                    {new Date(booking.date_time).toLocaleString()}
                  </div>
                  
                  <div className="text-sm truncate max-w-xs">
                    {booking.location_pickup}
                  </div>
                  
                  {booking.price_estimate && (
                    <div className="text-sm flex items-center gap-1">
                      <DollarSign size={14} className="text-gray-500" />
                      <span>₹{booking.price_estimate}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  {booking.booking_status === BookingStatus.COMPLETED ? (
                    booking.payment_status === 'completed' ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : (
                      <Button 
                        size="sm" 
                        onClick={() => navigate(`/consumer/booking-confirmation?bookingId=${booking.id}`)}
                      >
                        Pay Now
                      </Button>
                    )
                  ) : booking.booking_status === BookingStatus.CANCELLED ? (
                    <XCircle className="h-6 w-6 text-red-500" />
                  ) : null}
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/consumer/booking-confirmation?bookingId=${booking.id}`)}
                  >
                    View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
