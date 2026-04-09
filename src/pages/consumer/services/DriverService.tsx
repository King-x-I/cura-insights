
import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBookingFlow } from "@/hooks/useBookingFlow";
import { Loader2, Clock, MapPin, ArrowDown, ArrowUp, MessageSquare } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { LocationSearch } from "@/components/ui/location-search";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Base rates for driver service
const BASE_FARE = 150;
const HOURLY_RATE = 100;
const KM_RATE = 15;
const SERVICE_FEE = 50;

const formSchema = z.object({
  pickupLocation: z
    .string()
    .min(3, { message: "Please enter a valid pickup location" }),
  dropoffLocation: z
    .string()
    .min(3, { message: "Please enter a valid drop-off location" }),
  time: z
    .string()
    .min(1, { message: "Please select a time" }),
  duration: z
    .string()
    .min(1, { message: "Please select a duration" }),
  kilometers: z
    .number()
    .min(0)
    .optional(),
  additionalNotes: z
    .string()
    .optional(),
});

const DriverService = () => {
  const { user } = useAuth();
  const { createBooking } = useBookingFlow();
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [location, setLocation] = useState("");
  const [dropoff, setDropoff] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pickupLocation: "",
      dropoffLocation: "",
      time: "",
      duration: "",
      kilometers: 0,
      additionalNotes: "",
    },
  });

  const handleLocationSelect = (field: 'pickupLocation' | 'dropoffLocation', placeId: string, address: string) => {
    if (field === 'pickupLocation') {
      setLocation(address);
      form.setValue('pickupLocation', address);
    } else {
      setDropoff(address);
      form.setValue('dropoffLocation', address);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user?.id) {
      toast.error("You must be logged in to book a service");
      return;
    }

    try {
      setIsSubmitting(true);

      const totalHours = values.duration === "2hours" ? 2 : 
                        values.duration === "4hours" ? 4 : 
                        values.duration === "6hours" ? 6 : 
                        values.duration === "8hours" ? 8 : 12;

      const totalCost = BASE_FARE + 
                       (HOURLY_RATE * totalHours) + 
                       (KM_RATE * (values.kilometers || 0)) + 
                       SERVICE_FEE;

      // Create a service request in the requests table first
      const { data: requestData, error: requestError } = await supabase
        .from('requests')
        .insert({
          service_type: 'driver',
          location: values.pickupLocation,
          customer_id: user.id,
          status: 'pending',
          details: {
            pickupLocation: values.pickupLocation,
            dropoffLocation: isRoundTrip ? values.pickupLocation : values.dropoffLocation,
            isRoundTrip: isRoundTrip,
            time: values.time,
            duration: values.duration,
            estimatedKilometers: values.kilometers || 0,
            estimatedCost: totalCost,
            additionalNotes: values.additionalNotes || '',
          }
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Also create in driver_booking_requests for backward compatibility
      const { data: bookingRequest, error: bookingError } = await supabase
        .from('driver_booking_requests')
        .insert({
          user_id: user.id,
          location: values.pickupLocation,
          destination: isRoundTrip ? values.pickupLocation : values.dropoffLocation,
          date: new Date().toISOString().split('T')[0],
          time: values.time,
          duration: `${totalHours} hours`,
          service_type: 'driver',
          status: 'pending',
          additional_notes: values.additionalNotes,
          estimate_km: values.kilometers,
          cost_estimate: totalCost,
          is_round_trip: isRoundTrip
        })
        .select()
        .single();

      if (bookingError) {
        console.error("Error creating driver booking request:", bookingError);
        // Continue anyway since we have the main request
      }

      await createBooking('Driver', {
        pickupLocation: values.pickupLocation,
        dropoffLocation: isRoundTrip ? values.pickupLocation : values.dropoffLocation,
        startTime: values.time,
        endTime: values.time, // We'll calculate this based on duration
        isRoundTrip,
        estimatedKilometers: values.kilometers || 0,
        estimatedHours: totalHours,
        estimatedCost: totalCost,
        additionalNotes: values.additionalNotes
      });

      toast.success("Booking request submitted successfully");
      setBookingComplete(true);
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error("Failed to create booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (bookingComplete) {
    return (
      <DashboardLayout userType="consumer">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Finding a Driver</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center animate-pulse">
              <Loader2 className="animate-spin text-emerald-600" size={32} />
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg">
                We're searching for a driver in your area
              </p>
              <p className="text-gray-500">
                This won't take long. You'll receive a notification once a driver accepts your request.
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg w-full">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="text-emerald-500 font-medium">Pickup:</div>
                  <div>{form.getValues("pickupLocation")}</div>
                </div>
                <div className="flex gap-2">
                  <div className="text-emerald-500 font-medium">Dropoff:</div>
                  <div>{isRoundTrip ? 'Same as pickup (Round Trip)' : form.getValues("dropoffLocation")}</div>
                </div>
                <div className="flex gap-2">
                  <div className="text-emerald-500 font-medium">Time:</div>
                  <div>{form.getValues("time")}</div>
                </div>
                <div className="flex gap-2">
                  <div className="text-emerald-500 font-medium">Duration:</div>
                  <div>{form.getValues("duration")}</div>
                </div>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setBookingComplete(false)}>
              Cancel Request
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="consumer">
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold mb-6">Book Driver Service</h1>
        
        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="pickupLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pickup Location</FormLabel>
                      <FormControl>
                        <LocationSearch 
                          value={location}
                          onChange={setLocation}
                          placeholder="Enter pickup location"
                          onLocationSelect={(placeId, address) => handleLocationSelect('pickupLocation', placeId, address)}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!isRoundTrip && (
                  <FormField
                    control={form.control}
                    name="dropoffLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Drop-off Location</FormLabel>
                        <FormControl>
                          <LocationSearch 
                            value={dropoff}
                            onChange={setDropoff}
                            placeholder="Enter drop-off location"
                            onLocationSelect={(placeId, address) => handleLocationSelect('dropoffLocation', placeId, address)}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={isRoundTrip}
                    onCheckedChange={setIsRoundTrip}
                    id="round-trip"
                  />
                  <FormLabel htmlFor="round-trip">Round Trip (Same pickup and drop-off)</FormLabel>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Clock className="absolute left-3 top-3 text-gray-400" size={16} />
                            <Input type="time" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="2hours">2 Hours</SelectItem>
                            <SelectItem value="4hours">4 Hours</SelectItem>
                            <SelectItem value="6hours">6 Hours</SelectItem>
                            <SelectItem value="8hours">8 Hours</SelectItem>
                            <SelectItem value="fullday">Full Day (12 Hours)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="kilometers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <ArrowDown size={16} className="text-primary" />
                        <ArrowUp size={16} className="text-primary" />
                        Approximate Kilometers (optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Enter estimated distance"
                          {...field}
                          onChange={e => field.onChange(e.target.valueAsNumber)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="additionalNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MessageSquare size={16} className="text-primary" />
                        Additional Notes (optional)
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any special instructions?"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="font-medium mb-2">Price Estimate</div>
                  <div className="text-sm text-gray-600">
                    Estimated charges depend on duration and distance. Final price shown after driver confirmation.
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Confirm Booking"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DriverService;
