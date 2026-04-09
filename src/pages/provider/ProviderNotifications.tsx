
import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Calendar, CreditCard, MessageSquare, Clock, CheckCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

// Icon mapping for notification types
const notificationIcons = {
  booking: <Calendar className="h-5 w-5 text-indigo-500" />,
  payment: <CreditCard className="h-5 w-5 text-green-500" />,
  message: <MessageSquare className="h-5 w-5 text-blue-500" />,
  system: <Bell className="h-5 w-5 text-gray-500" />
};

interface Notification {
  id: string;
  type: string;
  message: string;
  seen: boolean;
  created_at: string;
  user_id: string;
}

const ProviderNotifications = () => {
  const { user } = useAuth();

  // Fetch notifications from Supabase
  const fetchNotifications = async () => {
    if (!user?.id) throw new Error("User not authenticated");
    
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    
    return data as Notification[];
  };

  const { 
    data: notifications, 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ["providerNotifications", user?.id],
    queryFn: fetchNotifications,
    enabled: !!user?.id
  });

  // Set up real-time subscription for new notifications
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('provider-notifications')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log('New notification:', payload);
          toast.info('You have a new notification');
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetch]);

  const markAsRead = async (id: string) => {
    if (!user?.id) return;
    
    const { error } = await supabase
      .from("notifications")
      .update({ seen: true })
      .eq("id", id)
      .eq("user_id", user.id);
      
    if (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark notification as read");
    } else {
      refetch();
    }
  };

  const deleteNotification = async (id: string) => {
    if (!user?.id) return;
    
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
      
    if (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    } else {
      refetch();
      toast.success("Notification deleted");
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id || !notifications) return;
    
    const unreadNotifications = notifications.filter(n => !n.seen);
    if (unreadNotifications.length === 0) return;
    
    const { error } = await supabase
      .from("notifications")
      .update({ seen: true })
      .eq("user_id", user.id)
      .eq("seen", false);
      
    if (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to mark notifications as read");
    } else {
      refetch();
      toast.success("All notifications marked as read");
    }
  };

  const clearAllNotifications = async () => {
    if (!user?.id || !notifications || notifications.length === 0) return;
    
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", user.id);
      
    if (error) {
      console.error("Error clearing notifications:", error);
      toast.error("Failed to clear notifications");
    } else {
      refetch();
      toast.success("All notifications cleared");
    }
  };

  // Format relative time
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <DashboardLayout userType="provider">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Notifications</h1>
            <p className="text-gray-600">Stay updated with your bookings and payments.</p>
          </div>
          
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start">
                  <Skeleton className="h-10 w-10 rounded-full mr-4" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-full max-w-xs mb-2" />
                    <Skeleton className="h-4 w-full max-w-lg" />
                  </div>
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
            <h1 className="text-3xl font-bold mb-2">Notifications</h1>
            <p className="text-gray-600">Stay updated with your bookings and payments.</p>
          </div>
          
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <p className="text-lg text-red-500">Error loading notifications: {(error as Error).message}</p>
              <Button onClick={() => refetch()} className="mt-4">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const unreadCount = notifications?.filter(notif => !notif.seen).length || 0;

  return (
    <DashboardLayout userType="provider">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Notifications</h1>
            <p className="text-gray-600">Stay updated with your bookings and services.</p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" onClick={markAllAsRead}>
                Mark all as read
              </Button>
            )}
            {notifications && notifications.length > 0 && (
              <Button variant="outline" onClick={clearAllNotifications}>
                Clear all
              </Button>
            )}
          </div>
        </div>

        {!notifications || notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <Bell className="h-10 w-10 text-gray-300 mb-4" />
              <p className="text-lg text-gray-500">You have no notifications</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => {
              // Default to system notification icon if type is not specified
              const type = notification.type as keyof typeof notificationIcons || 'system';
              const icon = notificationIcons[type] || notificationIcons.system;
              
              return (
                <Card 
                  key={notification.id} 
                  className={`overflow-hidden transition-colors ${notification.seen ? "" : "bg-blue-50 dark:bg-blue-900/10"}`}
                >
                  <CardContent className="p-4 flex items-start">
                    <div className="mr-4 mt-1">
                      {icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-gray-600">{notification.message}</p>
                        </div>
                        <div className="flex flex-col items-end ml-4">
                          <div className="text-sm text-gray-500">
                            {formatRelativeTime(notification.created_at)}
                          </div>
                          {!notification.seen && (
                            <Badge className="mt-1">New</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <div className="border-t px-4 py-2 flex justify-end gap-2 bg-gray-50">
                    {!notification.seen && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => markAsRead(notification.id)}
                        className="h-8 gap-1"
                      >
                        <CheckCircle size={14} />
                        Mark as read
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => deleteNotification(notification.id)}
                      className="h-8 gap-1 text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <X size={14} />
                      Delete
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProviderNotifications;
