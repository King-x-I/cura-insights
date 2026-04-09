
import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Eye, Check, X, Loader2 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from "date-fns";

interface Booking {
  id: string;
  customer_name: string;
  service_type: string;
  date: string;
  address: string;
  status: string;
  consumer_id?: string;
}

const ProviderBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Define filter tabs for the bookings
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    if (!user) return;
    
    fetchBookings();
    
    // Subscribe to booking changes
    const channel = supabase
      .channel('provider-bookings-changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'bookings',
          filter: `provider_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log('New booking:', payload);
          fetchBookings();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  
  const fetchBookings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          service_type,
          date_time,
          booking_status,
          location_pickup,
          consumer_id
        `)
        .eq('provider_id', user.id);
      
      if (bookingsError) throw bookingsError;
      
      // Get customer details for each booking
      const enhancedBookings = await Promise.all((bookingsData || []).map(async (booking) => {
        // Get customer name
        const { data: customerData } = await supabase
          .from('consumer_details')
          .select('full_name')
          .eq('user_id', booking.consumer_id)
          .single();
          
        return {
          id: booking.id,
          customer_name: customerData?.full_name || 'Unknown Customer',
          service_type: booking.service_type,
          date: format(new Date(booking.date_time), 'yyyy-MM-dd HH:mm'),
          address: booking.location_pickup || 'No location specified',
          status: booking.booking_status,
          consumer_id: booking.consumer_id
        } as Booking;
      }));
      
      setBookings(enhancedBookings);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBooking = async (bookingId: string) => {
    setProcessingId(bookingId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ booking_status: 'provider_assigned' })
        .eq('id', bookingId);
        
      if (error) throw error;
      
      // Update local state
      setBookings(bookings.map(booking => 
        booking.id === bookingId ? { ...booking, status: 'provider_assigned' } : booking
      ));
      
      toast.success('Booking accepted');
    } catch (err) {
      console.error('Error accepting booking:', err);
      toast.error('Failed to accept booking');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeclineBooking = async (bookingId: string) => {
    setProcessingId(bookingId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ booking_status: 'cancelled' })
        .eq('id', bookingId);
        
      if (error) throw error;
      
      // Update local state
      setBookings(bookings.map(booking => 
        booking.id === bookingId ? { ...booking, status: 'cancelled' } : booking
      ));
      
      toast.success('Booking declined');
    } catch (err) {
      console.error('Error declining booking:', err);
      toast.error('Failed to decline booking');
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewDetails = (bookingId: string) => {
    toast.info('Viewing booking details');
    // In a real app, navigate to booking details page
    // navigate(`/provider/bookings/${bookingId}`);
  };
  
  const filteredBookings = activeFilter === "all" 
    ? bookings
    : bookings.filter(booking => 
        activeFilter === "upcoming" 
          ? booking.status === "finding_provider" 
          : activeFilter === "accepted" 
            ? booking.status === "provider_assigned" 
            : activeFilter === "completed"
              ? booking.status === "completed"
              : booking.status === "cancelled"
      );

  return (
    <DashboardLayout userType="provider">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Bookings</h1>
          <p className="text-gray-600">Manage all your service bookings</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <Button 
            variant={activeFilter === "all" ? "default" : "outline"}
            onClick={() => setActiveFilter("all")}
            className="text-sm"
          >
            All Bookings
          </Button>
          <Button 
            variant={activeFilter === "upcoming" ? "default" : "outline"}
            onClick={() => setActiveFilter("upcoming")}
            className="text-sm"
          >
            Upcoming
          </Button>
          <Button 
            variant={activeFilter === "accepted" ? "default" : "outline"}
            onClick={() => setActiveFilter("accepted")}
            className="text-sm"
          >
            Accepted
          </Button>
          <Button 
            variant={activeFilter === "completed" ? "default" : "outline"}
            onClick={() => setActiveFilter("completed")}
            className="text-sm"
          >
            Completed
          </Button>
          <Button 
            variant={activeFilter === "declined" ? "default" : "outline"}
            onClick={() => setActiveFilter("declined")}
            className="text-sm"
          >
            Declined
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {activeFilter === "all" ? "All Bookings" : 
               activeFilter === "upcoming" ? "Upcoming Bookings" :
               activeFilter === "accepted" ? "Accepted Bookings" :
               activeFilter === "completed" ? "Completed Bookings" : 
               "Declined Bookings"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredBookings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => (
                    <TableRow key={booking.id} className="group">
                      <TableCell className="font-medium">{booking.customer_name}</TableCell>
                      <TableCell>{booking.service_type}</TableCell>
                      <TableCell>{booking.date}</TableCell>
                      <TableCell>{booking.address}</TableCell>
                      <TableCell>
                        <Badge variant={
                          booking.status === "finding_provider" ? "outline" :
                          booking.status === "provider_assigned" ? "default" :
                          booking.status === "completed" ? "secondary" :
                          "destructive"
                        }>
                          {booking.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {booking.status === "finding_provider" && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-500 hover:text-red-700"
                                onClick={() => handleDeclineBooking(booking.id)}
                                disabled={processingId === booking.id}
                              >
                                {processingId === booking.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X size={16} className="mr-1" />}
                                Decline
                              </Button>
                              <Button 
                                size="sm"
                                className="bg-green-500 hover:bg-green-600"
                                onClick={() => handleAcceptBooking(booking.id)}
                                disabled={processingId === booking.id}
                              >
                                {processingId === booking.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check size={16} className="mr-1" />}
                                Accept
                              </Button>
                            </>
                          )}
                          {(booking.status === "provider_assigned" || booking.status === "completed" || booking.status === "cancelled") && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewDetails(booking.id)}
                            >
                              <Eye size={16} className="mr-1" />
                              View Details
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No bookings found in this category</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ProviderBookings;
