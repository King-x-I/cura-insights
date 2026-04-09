import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RootLayout } from "@/components/layout/RootLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import NotFound from "@/pages/NotFound";
import Index from "@/pages/Index";
import GoogleCallback from "@/components/auth/GoogleCallback";

// Static pages
import AboutPage from "./pages/static/AboutPage";
import TermsPage from "./pages/static/TermsPage";

// Auth pages
import ConsumerLogin from "./pages/auth/ConsumerLogin";
import ConsumerSignup from "./pages/auth/ConsumerSignup";
import ProviderLogin from "./pages/auth/ProviderLogin";
import ProviderSignup from "./pages/auth/ProviderSignup";

// Consumer pages
import ConsumerDashboard from "./pages/consumer/ConsumerDashboard";
import DriverService from "./pages/consumer/services/DriverService";
import CaretakerService from "./pages/consumer/services/CaretakerService";
import NannyService from "./pages/consumer/services/NannyService";
import HouseHelperService from "./pages/consumer/services/HouseHelperService";
import ChefService from "./pages/consumer/services/ChefService";
import ParcelDeliveryService from "./pages/consumer/services/ParcelDeliveryService";
import ConsumerBookings from "./pages/consumer/ConsumerBookings";
import ConsumerHistory from "./pages/consumer/ConsumerHistory";
import ConsumerPayments from "./pages/consumer/ConsumerPayments";
import ConsumerNotifications from "./pages/consumer/ConsumerNotifications";
import ConsumerSettings from "./pages/consumer/ConsumerSettings";
import BookingConfirmation from "./pages/consumer/BookingConfirmation";

// Provider pages
import ProviderDashboard from "./pages/provider/ProviderDashboard";
import ProviderBookings from "./pages/provider/ProviderBookings";
import ProviderEarnings from "./pages/provider/ProviderEarnings";
import ProviderSettings from "./pages/provider/ProviderSettings";
import ProviderHistory from "./pages/provider/ProviderHistory";
import ProviderNotifications from "./pages/provider/ProviderNotifications";

// Admin pages (placeholder for now)
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProviderApprovals from "./pages/admin/AdminProviderApprovals";

// Add the payment test page import
import ServicePaymentTest from "./pages/consumer/services/ServicePaymentTest";

// Stripe Checkout pages
import CheckoutDemo from "./pages/payment/CheckoutDemo";
import SuccessPage from "./pages/payment/SuccessPage";
import CancelPage from "./pages/payment/CancelPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <RootLayout>
            <Routes>
              {/* Landing page */}
              <Route path="/" element={<Index />} />
              
              {/* Static pages */}
              <Route path="/about" element={<AboutPage />} />
              <Route path="/terms" element={<TermsPage />} />
              
              {/* Auth callback routes */}
              <Route path="/auth/google-callback" element={<GoogleCallback />} />
              
              {/* Stripe Checkout routes */}
              <Route path="/payment-demo" element={<CheckoutDemo />} />
              <Route path="/success" element={<SuccessPage />} />
              <Route path="/cancel" element={<CancelPage />} />
              
              {/* Consumer auth routes */}
              <Route path="/consumer/login" element={<ConsumerLogin />} />
              <Route path="/consumer/signup" element={<ConsumerSignup />} />
              
              {/* Provider auth routes */}
              <Route path="/provider/login" element={<ProviderLogin />} />
              <Route path="/provider/signup" element={<ProviderSignup />} />
              
              {/* Consumer protected routes */}
              <Route element={<ProtectedRoute requiredUserType="consumer" />}>
                <Route path="/consumer/dashboard" element={<ConsumerDashboard />} />
                <Route path="/consumer/bookings" element={<ConsumerBookings />} />
                <Route path="/consumer/history" element={<ConsumerHistory />} />
                <Route path="/consumer/payments" element={<ConsumerPayments />} />
                <Route path="/consumer/notifications" element={<ConsumerNotifications />} />
                <Route path="/consumer/settings" element={<ConsumerSettings />} />
                <Route path="/consumer/booking-confirmation" element={<BookingConfirmation />} />
                
                {/* Consumer service booking routes */}
                <Route path="/consumer/services/driver" element={<DriverService />} />
                <Route path="/consumer/services/caretaker" element={<CaretakerService />} />
                <Route path="/consumer/services/nanny" element={<NannyService />} />
                <Route path="/consumer/services/house-helper" element={<HouseHelperService />} />
                <Route path="/consumer/services/chef" element={<ChefService />} />
                <Route path="/consumer/services/parcel-delivery" element={<ParcelDeliveryService />} />
                
                {/* Add the payment test route */}
                <Route path="/consumer/payment-test" element={<ServicePaymentTest />} />
              </Route>
              
              {/* Provider protected routes */}
              <Route element={<ProtectedRoute requiredUserType="provider" />}>
                <Route path="/provider/dashboard" element={<ProviderDashboard />} />
                <Route path="/provider/bookings" element={<ProviderBookings />} />
                <Route path="/provider/history" element={<ProviderHistory />} />
                <Route path="/provider/notifications" element={<ProviderNotifications />} />
                <Route path="/provider/earnings" element={<ProviderEarnings />} />
                <Route path="/provider/settings" element={<ProviderSettings />} />
              </Route>
              
              {/* Admin protected routes */}
              <Route element={<ProtectedRoute requiredUserType="admin" />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/provider-approvals" element={<AdminProviderApprovals />} />
                
                {/* Additional admin routes will go here */}
              </Route>
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </RootLayout>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
