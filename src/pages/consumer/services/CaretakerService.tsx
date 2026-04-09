import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, MessageSquare, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { LocationSearch } from "@/components/ui/location-search";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  careType: z
    .string()
    .min(1, { message: "Please select a care type" }),
  location: z
    .string()
    .min(3, { message: "Please enter a valid location" }),
  date: z
    .date({ required_error: "Please select a date" }),
  time: z
    .string()
    .min(1, { message: "Please select a time" }),
  duration: z
    .string()
    .min(1, { message: "Please select a duration" }),
  instructions: z
    .string()
    .optional(),
});

const CaretakerService = () => {
  const { user } = useAuth();
  const [booking, setBooking] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      careType: "",
      location: "",
      time: "",
      duration: "",
      instructions: "",
    },
  });

  const handleLocationSelect = (placeId: string, address: string) => {
    console.log("Selected location:", address, "Place ID:", placeId);
    setLocation(address);
    form.setValue("location", address);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user?.id) {
      toast.error("You must be logged in to book a service");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create a service request in the requests table
      const { data: requestData, error: requestError } = await supabase
        .from('requests')
        .insert({
          service_type: 'caretaker',
          location: values.location,
          customer_id: user.id,
          status: 'pending',
          details: {
            careType: values.careType,
            date: values.date.toISOString(),
            time: values.time,
            duration: values.duration,
            instructions: values.instructions || '',
          }
        })
        .select()
        .single();
      
      if (requestError) {
        throw requestError;
      }
      
      setBooking(true);
      toast.success("Caretaker booking requested!");
    } catch (error) {
      console.error("Error creating service request:", error);
      toast.error("Failed to create booking request");
    } finally {
      setIsLoading(false);
    }
  };

  if (booking) {
    return (
      <DashboardLayout userType="consumer">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Finding a Caretaker</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center animate-pulse">
              <Loader2 className="animate-spin text-emerald-600" size={32} />
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg">
                We're searching for a caretaker in your area
              </p>
              <p className="text-gray-500">
                This won't take long. You'll receive a notification once a caretaker accepts your request.
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg w-full">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="text-emerald-500 font-medium">Care Type:</div>
                  <div>{form.getValues("careType")}</div>
                </div>
                <div className="flex gap-2">
                  <div className="text-emerald-500 font-medium">Location:</div>
                  <div>{form.getValues("location")}</div>
                </div>
                <div className="flex gap-2">
                  <div className="text-emerald-500 font-medium">Date:</div>
                  <div>{format(form.getValues("date"), "MMMM d, yyyy")}</div>
                </div>
                <div className="flex gap-2">
                  <div className="text-emerald-500 font-medium">Time:</div>
                  <div>{form.getValues("time")}</div>
                </div>
                <div className="flex gap-2">
                  <div className="text-emerald-500 font-medium">Duration:</div>
                  <div>{form.getValues("duration")}</div>
                </div>
                {form.getValues("instructions") && (
                  <div className="flex gap-2">
                    <div className="text-emerald-500 font-medium">Instructions:</div>
                    <div>{form.getValues("instructions")}</div>
                  </div>
                )}
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setBooking(null)}>
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
        <h1 className="text-3xl font-bold mb-6">Book a Caretaker</h1>
        
        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="careType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Care Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select care type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="gardening">Gardening</SelectItem>
                          <SelectItem value="outdoor-cleanup">Cleanup of Outdoor Areas (Porch, Balcony, Parking)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <LocationSearch 
                          value={location}
                          onChange={setLocation}
                          placeholder="Search for a location"
                          onLocationSelect={handleLocationSelect}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "MMMM d, yyyy")
                                ) : (
                                  <span>Select date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
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
                </div>
                
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
                
                <FormField
                  control={form.control}
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Instructions (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MessageSquare className="absolute left-3 top-3 text-gray-400" size={16} />
                          <Textarea 
                            placeholder="E.g. Focus only on balcony, water only succulents, etc."
                            className="pl-10 min-h-[100px]"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="font-medium mb-2">Price Estimate</div>
                  <div className="text-sm text-gray-600">
                    Estimated charges depend on task & duration. Final price shown after caretaker confirmation.
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Processing..." : "Confirm Booking"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CaretakerService;
