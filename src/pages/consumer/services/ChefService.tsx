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
import { LocationSearch } from "@/components/ui/location-search";
import { LocationMap } from "@/components/maps/LocationMap";
import { MapPin, Calendar as CalendarIcon, Clock, MessageSquare, Utensils, Loader2, Users } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  cuisineType: z
    .string()
    .min(1, { message: "Please select a cuisine type" }),
  location: z
    .string()
    .min(3, { message: "Please enter a valid location" }),
  date: z
    .date({ required_error: "Please select a date" }),
  time: z
    .string()
    .min(1, { message: "Please select a time" }),
  people: z
    .string()
    .min(1, { message: "Please enter number of people" }),
  ingredients: z
    .boolean(),
  instructions: z
    .string()
    .optional(),
});

const ChefService = () => {
  const [booking, setBooking] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cuisineType: "",
      location: "",
      time: "",
      people: "",
      ingredients: false,
      instructions: "",
    },
  });

  const handleLocationSelect = async (_placeId: string, address: string) => {
    form.setValue("location", address);
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    
    // Mock API call to book a chef
    setTimeout(() => {
      setBooking(true);
      toast.success("Chef booking requested!");
      setIsLoading(false);
    }, 2000);
  };

  if (booking) {
    return (
      <DashboardLayout userType="consumer">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Finding a Chef</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center animate-pulse">
              <Loader2 className="animate-spin text-amber-600" size={32} />
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg">
                We're looking for a chef specialized in {form.getValues("cuisineType")} cuisine
              </p>
              <p className="text-gray-500">
                This won't take long. You'll receive a notification once a chef accepts your request.
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg w-full">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="text-amber-500 font-medium">Cuisine:</div>
                  <div>{form.getValues("cuisineType")}</div>
                </div>
                <div className="flex gap-2">
                  <div className="text-amber-500 font-medium">Location:</div>
                  <div>{form.getValues("location")}</div>
                </div>
                <div className="flex gap-2">
                  <div className="text-amber-500 font-medium">Date:</div>
                  <div>{format(form.getValues("date"), "MMMM d, yyyy")}</div>
                </div>
                <div className="flex gap-2">
                  <div className="text-amber-500 font-medium">Time:</div>
                  <div>{form.getValues("time")}</div>
                </div>
                <div className="flex gap-2">
                  <div className="text-amber-500 font-medium">Guests:</div>
                  <div>{form.getValues("people")} people</div>
                </div>
                <div className="flex gap-2">
                  <div className="text-amber-500 font-medium">Ingredients:</div>
                  <div>{form.getValues("ingredients") ? "Will be provided by you" : "Will be brought by chef"}</div>
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
        <h1 className="text-3xl font-bold mb-6">Book a Chef</h1>
        
        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="cuisineType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cuisine Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select cuisine" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="italian">Italian</SelectItem>
                          <SelectItem value="indian">Indian</SelectItem>
                          <SelectItem value="chinese">Chinese</SelectItem>
                          <SelectItem value="japanese">Japanese</SelectItem>
                          <SelectItem value="mexican">Mexican</SelectItem>
                          <SelectItem value="thai">Thai</SelectItem>
                          <SelectItem value="mediterranean">Mediterranean</SelectItem>
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
                    <FormItem className="space-y-4">
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <LocationSearch
                          value={field.value}
                          onChange={field.onChange}
                          onLocationSelect={handleLocationSelect}
                          placeholder="Enter your address"
                        />
                      </FormControl>
                      <LocationMap
                        pickupLocation={selectedLocation}
                        className="h-[200px] mt-2"
                        showRoute={false}
                      />
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
                        <FormLabel>Meal Time</FormLabel>
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
                  name="people"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of People</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Users className="absolute left-3 top-3 text-gray-400" size={16} />
                          <Input type="number" min="1" max="20" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="ingredients"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Ingredients Provided by You?
                        </FormLabel>
                        <FormDescription>
                          Toggle if you will provide the ingredients
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Instructions</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MessageSquare className="absolute left-3 top-3 text-gray-400" size={16} />
                          <Textarea 
                            placeholder="Any dietary restrictions or special requests..."
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
                  <div className="flex items-center gap-2 font-medium mb-2">
                    <Utensils className="h-5 w-5 text-amber-500" />
                    <span>Price Estimate</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Chef Services (3-5 hours):</span>
                      <span>${form.watch("people") ? Math.max(80, parseInt(form.watch("people")) * 20) : 80}-${form.watch("people") ? Math.max(150, parseInt(form.watch("people")) * 35) : 150}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Ingredients (if not provided):</span>
                      <span>{form.watch("ingredients") ? "$0" : `$${form.watch("people") ? parseInt(form.watch("people")) * 15 : "15"}/person`}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Service fee:</span>
                      <span>$25</span>
                    </div>
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Processing..." : "Book a Chef"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

const FormDescription = ({ children }: { children: React.ReactNode }) => (
  <div className="text-sm text-gray-500">{children}</div>
);

export default ChefService;
