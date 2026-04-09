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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LocationSearch } from "@/components/ui/location-search";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  serviceType: z
    .string()
    .min(1, { message: "Please select a service type" }),
  location: z
    .string()
    .min(3, { message: "Please enter a valid location" }),
  date: z
    .date({ required_error: "Please select a date" }),
  time: z
    .string()
    .min(1, { message: "Please select a time" }),
  hours: z
    .string()
    .min(1, { message: "Please select number of hours" }),
  special_tools: z
    .string()
    .optional(),
});

const serviceTypes = [
  { id: 'cleaning', label: 'Cleaning (indoor sweeping, dusting)' },
  { id: 'dishwashing', label: 'Dishwashing' },
  { id: 'laundry', label: 'Laundry (washing, drying, folding)' }
] as const;

const HouseHelperService = () => {
  const { user } = useAuth();
  const [booking, setBooking] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceType: "",
      location: "",
      time: "",
      hours: "",
      special_tools: "",
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
          service_type: 'house-helper',
          location: values.location,
          customer_id: user.id,
          status: 'pending',
          details: {
            serviceType: values.serviceType,
            date: values.date.toISOString(),
            time: values.time,
            hours: values.hours,
            special_tools: values.special_tools || '',
          }
        })
        .select()
        .single();
      
      if (requestError) {
        throw requestError;
      }
      
      setBooking(true);
      toast.success("House helper booking requested!");
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
            <CardTitle className="text-center">Finding a House Helper</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center animate-pulse">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg">
                We're searching for a house helper in your area
              </p>
              <p className="text-gray-500">
                This won't take long. You'll receive a notification once a house helper accepts your request.
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg w-full">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="text-indigo-500 font-medium">Service Type:</div>
                  <div>{form.getValues("serviceType")}</div>
                </div>
                <div className="flex gap-2">
                  <div className="text-indigo-500 font-medium">Location:</div>
                  <div>{form.getValues("location")}</div>
                </div>
                <div className="flex gap-2">
                  <div className="text-indigo-500 font-medium">Date:</div>
                  <div>{format(form.getValues("date"), "MMMM d, yyyy")}</div>
                </div>
                <div className="flex gap-2">
                  <div className="text-indigo-500 font-medium">Time:</div>
                  <div>{form.getValues("time")}</div>
                </div>
                <div className="flex gap-2">
                  <div className="text-indigo-500 font-medium">Hours:</div>
                  <div>{form.getValues("hours")}</div>
                </div>
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
        <h1 className="text-3xl font-bold mb-6">Book a House Helper</h1>
        
        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Type of Help Needed</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          {serviceTypes.map((type) => (
                            <div key={type.id} className="flex items-center space-x-2">
                              <RadioGroupItem value={type.id} id={type.id} />
                              <label htmlFor={type.id} className="cursor-pointer">{type.label}</label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
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
                  name="hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hours Required</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select hours" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="2">2 Hours</SelectItem>
                          <SelectItem value="3">3 Hours</SelectItem>
                          <SelectItem value="4">4 Hours</SelectItem>
                          <SelectItem value="5">5 Hours</SelectItem>
                          <SelectItem value="6">6 Hours</SelectItem>
                          <SelectItem value="8">8 Hours</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="special_tools"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Tools or Requirements</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MessageSquare className="absolute left-3 top-3 text-gray-400" size={16} />
                          <Textarea 
                            placeholder="E.g. Please bring mop, or focus only on kitchen area."
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
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Base rate:</span>
                      <span>$15/hour</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Service fee:</span>
                      <span>$5</span>
                    </div>
                    <div className="flex justify-between font-medium pt-2 border-t border-gray-200 mt-2">
                      <span>Total (est):</span>
                      <span>${form.watch("hours") ? 15 * parseInt(form.watch("hours")) + 5 : "TBD"}</span>
                    </div>
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Processing..." : "Book House Helper"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default HouseHelperService;
