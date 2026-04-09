import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, HeartPulse, Baby, Home, Package, Utensils, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useBookings } from "@/hooks/useBookings";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

// Status badge colors
const statusColors = {
  finding_provider: "yellow",
  provider_assigned: "blue",
  completed: "green",
  cancelled: "red",
  pending: "yellow",
  confirmed: "green",
  "in-progress": "blue"
};

const getIconForService = (serviceType: string) => {
  switch (serviceType?.toLowerCase()) {
    case "driver": return Car;
    case "caretaker": return HeartPulse;
    case "nanny": return Baby;
    case "house helper": return Home;
    case "chef": return Utensils;
    case "parcel delivery": return Package;
    default: return Car;
  }
};

const ConsumerBookings = () => {
  const { activeBookings, loading } = useBookings();
  const navigate = useNavigate();

  const handleCancel = async (id: string) => {
    try {
      const { error } = await supabase.from('bookings').update({ booking_status: 'cancelled' }).eq('id', id);
      if (error) throw error;
      toast.success(`Booking cancelled successfully`);
      // Optional: Since it's a hook we could reload the page or add a reload hook callback.
      window.location.reload();
    } catch (err: any) {
      toast.error('Failed to cancel: ' + err.message);
    }
  };

  const handleTrack = (id: string) => {
    navigate(`/consumer/booking-confirmation?bookingId=${id}`);
  };

  const getStatusBadge = (status: string) => {
    const color = statusColors[status as keyof typeof statusColors] || "gray";
    let displayStatus = status.replace('_', ' ');
    displayStatus = displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1);
    
    return (
      <Badge className={`bg-${color}-100 text-${color}-800 border-${color}-200`}>
        {displayStatus}
      </Badge>
    );
  };

  return (
    <DashboardLayout userType="consumer">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Your Bookings</h1>
          <p className="text-gray-600">Track and manage your active service bookings.</p>
        </div>

        {loading ? (
          <div className="flex justify-center p-8"><p>Loading bookings...</p></div>
        ) : activeBookings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <p className="text-lg text-gray-500 mb-4">You don't have any active bookings</p>
              <Button variant="outline" onClick={() => window.location.href = "/consumer/dashboard"}>
                Book a Service
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {activeBookings.map((booking: any) => {
              const BookingIcon = getIconForService(booking.service_type);
              
              const providerName = booking.provider_details?.full_name || "Pending Assignment";

              return (
                <Card key={booking.id} className="overflow-hidden">
                  <CardHeader className="pb-2 flex flex-row items-center">
                    <div className="flex items-center flex-1">
                      <div className="mr-3 p-2 rounded-full bg-primary/10">
                        <BookingIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{booking.service_type} Service</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <MapPin size={14} />
                          <span>{booking.location_pickup || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(booking.booking_status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <Clock size={14} className="mr-2 text-gray-500" />
                          <span>
                            {new Date(booking.date_time).toLocaleDateString()} at {new Date(booking.date_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Provider:</span> {providerName}
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end items-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(booking.id)}
                          disabled={booking.booking_status === "completed" || booking.booking_status === "cancelled"}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleTrack(booking.id)}
                        >
                          Track
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ConsumerBookings;
