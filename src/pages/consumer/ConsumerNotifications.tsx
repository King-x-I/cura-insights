import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Calendar, CreditCard, MessageSquare, Clock, CheckCircle, X } from "lucide-react";
import { toast } from "sonner";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Icon mapping for notification types
const notificationIcons = {
  booking: <Calendar className="h-5 w-5 text-indigo-500" />,
  payment: <CreditCard className="h-5 w-5 text-green-500" />,
  message: <MessageSquare className="h-5 w-5 text-blue-500" />,
  system: <Bell className="h-5 w-5 text-gray-500" />
};

const ConsumerNotifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const { fetchUserNotifications, markNotificationAsSeen, isLoading } = useNotifications();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    const data = await fetchUserNotifications(user.id);
    // Standardize to our local schema naming
    const normalized = data.map(n => ({
      id: n.id,
      type: n.type || "system",
      title: n.title,
      message: n.message,
      timestamp: new Date(n.created_at),
      read: n.seen || false
    }));
    setNotifications(normalized);
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const { error } = await supabase.from('notifications').update({ seen: true }).eq('user_id', user.id).eq('seen', false);
      if (error) throw error;
      setNotifications(notifications.map(notif => ({ ...notif, read: true })));
      toast.success("All notifications marked as read");
    } catch (err: any) {
      toast.error('Failed to update notifications');
    }
  };

  const clearAllNotifications = async () => {
    if (!user) return;
    try {
      const { error } = await supabase.from('notifications').delete().eq('user_id', user.id);
      if (error) throw error;
      setNotifications([]);
      toast.success("All notifications cleared");
    } catch (err: any) {
      toast.error('Failed to clear notifications');
    }
  };

  const markAsRead = async (id: string) => {
    const success = await markNotificationAsSeen(id);
    if (success) {
      setNotifications(notifications.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      ));
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
      setNotifications(notifications.filter(notif => notif.id !== id));
      toast.success('Notification deleted');
    } catch (err: any) {
      toast.error('Failed to delete notification');
    }
  };

  // Format relative time
  const formatRelativeTime = (date: Date) => {
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

  const unreadCount = notifications.filter(notif => !notif.read).length;

  return (
    <DashboardLayout userType="consumer">
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
            {notifications.length > 0 && (
              <Button variant="outline" onClick={clearAllNotifications}>
                Clear all
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8"><p>Loading notifications...</p></div>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <Bell className="h-10 w-10 text-gray-300 mb-4" />
              <p className="text-lg text-gray-500">You have no notifications</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => {
              const icon = notificationIcons[notification.type as keyof typeof notificationIcons] || notificationIcons.system;
              
              return (
                <Card 
                  key={notification.id} 
                  className={`overflow-hidden transition-colors ${notification.read ? "" : "bg-blue-50 dark:bg-blue-900/10"}`}
                >
                  <CardContent className="p-4 flex items-start">
                    <div className="mr-4 mt-1">
                      {icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{notification.title}</h3>
                          <p className="text-gray-600">{notification.message}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="text-sm text-gray-500">
                            {formatRelativeTime(notification.timestamp)}
                          </div>
                          {!notification.read && (
                            <Badge className="mt-1">New</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <div className="border-t px-4 py-2 flex justify-end gap-2 bg-gray-50">
                    {!notification.read && (
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

export default ConsumerNotifications;
