
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const serviceTypes = [
  { value: 'driver', label: 'Driver' },
  { value: 'caretaker', label: 'Caretaker' },
  { value: 'nanny', label: 'Nanny' },
  { value: 'househelper', label: 'House Helper' },
  { value: 'chef', label: 'Chef' },
  { value: 'parceldelivery', label: 'Parcel Delivery' },
];

export const CreateServiceRequest = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    serviceType: '',
    location: '',
    details: ''
  });
  
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to create a request');
      return;
    }
    
    if (!formData.serviceType || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('requests')
        .insert({
          service_type: formData.serviceType,
          location: formData.location,
          customer_id: user.id,
          details: formData.details ? { notes: formData.details } : null
        });
      
      if (error) throw error;
      
      toast.success('Service request created successfully');
      setFormData({ serviceType: '', location: '', details: '' });
    } catch (error: any) {
      console.error('Error creating service request:', error);
      toast.error(error.message || 'Failed to create service request');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Request a Service</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="serviceType">Service Type*</Label>
            <Select
              value={formData.serviceType}
              onValueChange={(value) => handleChange('serviceType', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="location">Location*</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="Enter your location"
              required
            />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="details">Additional Details</Label>
            <Textarea
              id="details"
              value={formData.details}
              onChange={(e) => handleChange('details', e.target.value)}
              placeholder="Provide any additional information"
              rows={3}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Submit Request
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
