
import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Car, HeartPulse, Baby, Clock, CalendarDays, Download, Star } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

// Service icon mapping
const serviceIcons: Record<string, React.ElementType> = {
  driver: Car,
  caretaker: HeartPulse,
  nanny: Baby,
  "house-helper": Clock,
  chef: Clock,
  "parcel-delivery": Clock
};

const ProviderHistory = () => {
  const { user } = useAuth();

  const fetchBookingHistory = async () => {
    if (!user?.id) throw new Error("User not authenticated");
    
    // Fetch completed or cancelled bookings for this provider
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id,
        service_type,
        date_time,
        booking_status,
        price_estimate,
        location_pickup,
        location_drop,
        service_details,
        consumer_details(full_name)
      `)
      .eq("provider_id", user.id)
      .in("booking_status", ["completed", "cancelled"])
      .order("date_time", { ascending: false });
    
    if (error) throw error;
    
    return data;
  };

  const { data: bookingHistory, isLoading, error } = useQuery({
    queryKey: ["providerBookingHistory", user?.id],
    queryFn: fetchBookingHistory,
    enabled: !!user?.id
  });

  const handleDownloadInvoice = (id: string) => {
    toast.success(`Invoice for booking ${id} is being downloaded`);
    // In a real app, you would generate and download a PDF invoice
  };

  // Function to determine the appropriate icon for a service
  const getServiceIcon = (serviceType: string) => {
    const IconComponent = serviceIcons[serviceType] || Clock;
    return <IconComponent className="h-5 w-5 text-primary" />;
  };

  if (isLoading) {
    return (
      <DashboardLayout userType="provider">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Service History</h1>
            <p className="text-gray-600">View your past service history and details.</p>
          </div>
          
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-8 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout userType="provider">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Service History</h1>
            <p className="text-gray-600">View your past service history and details.</p>
          </div>
          
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <p className="text-lg text-red-500">Error loading history: {(error as Error).message}</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="provider">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Service History</h1>
          <p className="text-gray-600">View your past service history and details.</p>
        </div>

        {!bookingHistory || bookingHistory.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <p className="text-lg text-gray-500">No service history yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookingHistory.map((booking: any) => (
              <Card key={booking.id} className="overflow-hidden">
                <CardHeader className="pb-2 flex flex-row items-center">
                  <div className="flex items-center flex-1">
                    <div className="mr-3 p-2 rounded-full bg-primary/10">
                      {getServiceIcon(booking.service_type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg capitalize">
                        {booking.service_type.replace('-', ' ')} Service
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <CalendarDays size={14} />
                        <span>
                          {new Date(booking.date_time).toLocaleDateString()} at {
                            new Date(booking.date_time).toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={booking.booking_status === "completed" ? "default" : "destructive"}
                    >
                      {booking.booking_status.charAt(0).toUpperCase() + booking.booking_status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Customer:</span> {booking.consumer_details?.full_name || 'Unknown'}
                      </div>
                      {booking.location_pickup && (
                        <div className="text-sm">
                          <span className="font-medium">Pickup:</span> {booking.location_pickup}
                        </div>
                      )}
                      {booking.location_drop && (
                        <div className="text-sm">
                          <span className="font-medium">Drop:</span> {booking.location_drop}
                        </div>
                      )}
                      {booking.booking_status === "completed" && booking.price_estimate && (
                        <div className="text-sm">
                          <span className="font-medium">Amount:</span> ${booking.price_estimate.toFixed(2)}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 justify-end items-center">
                      {booking.booking_status === "completed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadInvoice(booking.id)}
                        >
                          <Download size={14} className="mr-1" /> Invoice
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProviderHistory;
