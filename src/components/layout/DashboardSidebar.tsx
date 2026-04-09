
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Logo } from "@/components/Logo";
import { 
  Calendar, Home, CreditCard, Bell, 
  History, LogOut, Settings, HelpCircle,
  CheckCircle, Users, BarChart
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useChatbase } from "@/hooks/useChatbase";

interface SidebarProps {
  userType: "consumer" | "provider";
}

export function DashboardSidebar({ userType }: SidebarProps) {
  const location = useLocation();
  const { signOut } = useAuth();
  const { openChat } = useChatbase({ chatbotId: '8vY43H3xte3q7CfWt1uoP' });
  
  const consumerLinks = [
    { icon: Home, label: "Dashboard", href: "/consumer/dashboard" },
    { icon: Calendar, label: "Bookings", href: "/consumer/bookings" },
    { icon: History, label: "History", href: "/consumer/history" },
    { icon: CreditCard, label: "Payments", href: "/consumer/payments" },
    { icon: Bell, label: "Notifications", href: "/consumer/notifications" },
    { icon: Settings, label: "Settings", href: "/consumer/settings" },
  ];
  
  const providerLinks = [
    { icon: Home, label: "Dashboard", href: "/provider/dashboard" },
    { icon: Calendar, label: "Bookings", href: "/provider/bookings" },
    { icon: History, label: "History", href: "/provider/history" },
    { icon: CreditCard, label: "Earnings", href: "/provider/earnings" },
    { icon: Bell, label: "Notifications", href: "/provider/notifications" },
    { icon: Settings, label: "Settings", href: "/provider/settings" },
  ];
  
  const adminLinks = [
    { icon: Home, label: "Dashboard", href: "/admin/dashboard" },
    { icon: CheckCircle, label: "Provider Approvals", href: "/admin/provider-approvals" },
    { icon: Users, label: "Users", href: "/admin/users" },
    { icon: BarChart, label: "Analytics", href: "/admin/analytics" },
    { icon: Settings, label: "Settings", href: "/admin/settings" },
  ];
  
  let navigationLinks = userType === "consumer" ? consumerLinks : providerLinks;
  if (location.pathname.startsWith("/admin")) {
    navigationLinks = adminLinks;
  }
  
  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };
  
  return (
    <Sidebar>
      <SidebarContent>
        <div className="px-6 py-4">
          <Logo />
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationLinks.map((link) => (
                <SidebarMenuItem key={link.href}>
                  <SidebarMenuButton asChild isActive={location.pathname === link.href}>
                    <Link to={link.href} className="w-full">
                      <link.icon size={20} />
                      <span>{link.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout}>
                  <LogOut size={20} />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <div className="mt-auto px-4 pb-4">
          <Button 
            variant="outline" 
            className="w-full flex items-center gap-2 mt-6"
            onClick={() => {
              console.log("Help button clicked, opening Chatbase...");
              openChat();
            }}
          >
            <HelpCircle size={18} />
            <span>Need Help?</span>
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
