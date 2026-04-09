
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookingStatus } from '@/hooks/useBookingFlow';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, MapPin, Loader2 } from 'lucide-react';

export interface ActiveBookingsListProps {
  bookings: any[];
  loading: boolean;
}

export const getStatusBadge = (status: string) => {
  switch (status) {
    case BookingStatus.FINDING_PROVIDER:
      return <Badge className="bg-yellow-500">Finding Provider</Badge>;
    case BookingStatus.PROVIDER_ASSIGNED:
      return <Badge className="bg-blue-500">Provider Assigned</Badge>;
    case BookingStatus.COMPLETED:
      return <Badge className="bg-green-500">Completed</Badge>;
    case BookingStatus.CANCELLED:
      return <Badge className="bg-red-500">Cancelled</Badge>;
    default:
      return <Badge>Unknown</Badge>;
  }
};

export function ActiveBookingsList({ bookings, loading }: ActiveBookingsListProps) {
  const navigate = useNavigate();

  const viewBookingDetails = (bookingId: string) => {
    navigate(`/consumer/booking-confirmation?bookingId=${bookingId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">You don't have any active bookings.</p>
          <p className="mt-2">Browse services below to make a booking.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {bookings.map((booking) => (
        <Card key={booking.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-lg capitalize">
                    {booking.service_type?.replace(/-/g, ' ')}
                  </h3>
                  {getStatusBadge(booking.booking_status)}
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock size={16} className="text-gray-500" />
                    <span>{new Date(booking.date_time).toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <MapPin size={16} className="text-gray-500" />
                    <span className="truncate max-w-xs">{booking.location_pickup}</span>
                  </div>
                  
                  {booking.provider_details && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="font-medium">Provider: {booking.provider_details.full_name}</p>
                      {booking.provider_details.phone && (
                        <p className="text-gray-600">{booking.provider_details.phone}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center">
                <Button
                  variant="default"
                  onClick={() => viewBookingDetails(booking.id)}
                >
                  View Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
