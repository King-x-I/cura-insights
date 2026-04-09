
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Bell, MapPin, Clock, Calendar } from 'lucide-react';
import { useServiceRequests, ServiceRequest } from '@/hooks/useServiceRequests';
import { format } from 'date-fns';

export const ServiceRequestsWidget = () => {
  const { requests, loading, acceptRequest, declineRequest } = useServiceRequests();
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const handleAccept = async (requestId: string) => {
    setProcessingId(requestId);
    await acceptRequest(requestId);
    setProcessingId(null);
  };
  
  const handleDecline = async (requestId: string) => {
    setProcessingId(requestId);
    await declineRequest(requestId);
    setProcessingId(null);
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'yyyy-MM-dd HH:mm');
    } catch (e) {
      return dateString;
    }
  };

  const formatServiceType = (type: string) => {
    return type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (loading) {
    return (
      <Card id="service-requests" className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Service Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading requests...</p>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card id="service-requests" className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Service Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Bell className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-1">No pending service requests</p>
          <p className="text-sm text-gray-400">New requests will appear here automatically</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="service-requests" className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Service Requests
          <Badge variant="secondary" className="ml-2">
            {requests.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requests.map((request: ServiceRequest) => {
            // Format service details for display
            let serviceDetails = [];
            if (request.details) {
              if (request.details.date) {
                serviceDetails.push({ 
                  icon: <Calendar className="h-4 w-4 text-gray-500" />,
                  text: format(new Date(request.details.date), 'MMMM d, yyyy')
                });
              }
              
              if (request.details.time) {
                serviceDetails.push({ 
                  icon: <Clock className="h-4 w-4 text-gray-500" />,
                  text: request.details.time
                });
              }
            }

            return (
              <Card key={request.id} className="overflow-hidden border-l-4 border-blue-500">
                <CardContent className="p-4">
                  <div className="mb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg capitalize">
                          {formatServiceType(request.service_type)} Service
                        </h3>
                        <p className="text-gray-600">{request.customer_name}</p>
                      </div>
                      <Badge variant="outline" className="bg-blue-50">New</Badge>
                    </div>
                    
                    <div className="mt-3 space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{request.location || "No location specified"}</span>
                      </div>
                      
                      {serviceDetails.map((detail, index) => (
                        <div key={index} className="flex items-center gap-2">
                          {detail.icon}
                          <span>{detail.text}</span>
                        </div>
                      ))}
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{formatDateTime(request.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDecline(request.id)}
                      disabled={processingId === request.id}
                      className="text-gray-600"
                    >
                      {processingId === request.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Decline
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleAccept(request.id)}
                      disabled={processingId === request.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {processingId === request.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Accept
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
