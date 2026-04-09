import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, HeartPulse, Baby, Home, Package, Utensils, Clock, CalendarDays, Download, Star } from "lucide-react";
import { toast } from "sonner";
import { useBookings } from "@/hooks/useBookings";

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

const ConsumerHistory = () => {
  const { recentBookings, loading } = useBookings();

  const handleDownloadInvoice = (id: string) => {
    toast.success(`Invoice for booking ${id} is being downloaded`);
    // In a real app, you would generate and download a PDF invoice
  };

  const handleRateService = (id: string) => {
    toast.info(`Rate your experience for booking ${id}`);
    // In a real app, you would open a rating modal or navigate to a rating page
  };

  return (
    <DashboardLayout userType="consumer">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Booking History</h1>
          <p className="text-gray-600">View your past bookings and service history.</p>
        </div>

        {loading ? (
          <div className="flex justify-center p-8"><p>Loading history...</p></div>
        ) : recentBookings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <p className="text-lg text-gray-500">No booking history yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {recentBookings.map((booking: any) => {
              const BookingIcon = getIconForService(booking.service_type);
              
              const providerName = booking.provider_details?.full_name || "Provider details unavailable";
              // Assuming price_estimate or amount is stored. Using amount or price_estimate depending on schema
              const amount = booking.price_estimate || 0;

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
                          <CalendarDays size={14} />
                          <span>
                            {new Date(booking.date_time).toLocaleDateString()} at {new Date(booking.date_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
                          <span className="font-medium">Provider:</span> {providerName}
                        </div>
                        {booking.booking_status === "completed" && (
                          <div className="text-sm">
                            <span className="font-medium">Amount:</span> ${amount.toFixed(2)}
                          </div>
                        )}
                        {/* We don't have ratings implemented in DB schema yet, leaving static rated=false mostly */}
                      </div>
                      <div className="flex gap-2 justify-end items-center">
                        {booking.booking_status === "completed" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadInvoice(booking.id)}
                            >
                              <Download size={14} className="mr-1" /> Invoice
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleRateService(booking.id)}
                            >
                              <Star size={14} className="mr-1" /> Rate
                            </Button>
                          </>
                        )}
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

export default ConsumerHistory;
