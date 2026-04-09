
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmailNotificationProps {
  to: string | string[];
  subject: string;
  templateType: 'provider-application' | 'provider-approved' | 'provider-rejected' | 'booking-confirmation' | 'payment-receipt';
  templateData: Record<string, any>;
}

interface UseNotificationsReturn {
  sendEmailNotification: (props: EmailNotificationProps) => Promise<boolean>;
  markNotificationAsSeen: (notificationId: string) => Promise<boolean>;
  fetchUserNotifications: (userId: string, limit?: number) => Promise<any[]>;
  isLoading: boolean;
  error: string | null;
}

export function useNotifications(): UseNotificationsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendEmailNotification = async ({
    to,
    subject,
    templateType,
    templateData
  }: EmailNotificationProps): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`Sending ${templateType} email notification to:`, to);
      
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to,
          subject,
          templateType,
          templateData
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to send notification');
      }

      console.log('Email notification sent successfully:', data);
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send notification';
      console.error('Notification error:', errorMessage);
      setError(errorMessage);
      toast.error(`Notification failed: ${errorMessage}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const markNotificationAsSeen = async (notificationId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ seen: true })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error('Error marking notification as seen:', err);
      return false;
    }
  };

  const fetchUserNotifications = async (userId: string, limit = 20): Promise<any[]> => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendEmailNotification,
    markNotificationAsSeen,
    fetchUserNotifications,
    isLoading,
    error
  };
}
