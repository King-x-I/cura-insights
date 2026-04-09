import React from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Award, Clock, Star } from "lucide-react";

const features = [
  {
    title: "Verified Providers",
    description: "All our service providers are thoroughly vetted and background checked",
    icon: Shield,
    color: "text-blue-500",
  },
  {
    title: "Secure Payments",
    description: "Safe and hassle-free payment processing for all services",
    icon: Award,
    color: "text-green-500",
  },
  {
    title: "Real-time Tracking",
    description: "Track your service provider's location and arrival time",
    icon: Clock,
    color: "text-purple-500",
  },
  {
    title: "Quality Guaranteed",
    description: "All services backed by our satisfaction guarantee",
    icon: Star,
    color: "text-yellow-500",
  },
];

export function LandingHero() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Main content */}
      <div className="relative flex-grow flex flex-col items-center justify-center overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-teal-50" />
        
        {/* Animated circle patterns */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute w-96 h-96 rounded-full bg-indigo-100/50 -top-20 -left-20 animate-pulse" style={{ animationDuration: '15s' }} />
          <div className="absolute w-96 h-96 rounded-full bg-teal-100/50 bottom-0 right-0 animate-pulse" style={{ animationDuration: '20s' }} />
          <div className="absolute w-64 h-64 rounded-full bg-amber-100/50 top-1/2 left-1/4 animate-pulse" style={{ animationDuration: '25s' }} />
        </div>
        
        {/* Content */}
        <div className="relative z-10 text-center px-6 sm:px-10 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Logo size="large" />
            
            <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
              Your Trusted Service Partner
            </h1>
            
            <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
              Connecting you with verified professionals for all your home and personal service needs.
            </p>
            
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-lg mx-auto">
              <Button 
                className="text-lg py-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-indigo-200"
                onClick={() => navigate("/consumer/login")}
              >
                Need a Service <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Button 
                className="text-lg py-6 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-emerald-200"
                onClick={() => navigate("/provider/login")}
              >
                Provide a Service <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Features Section */}
        <div className="relative z-10 mt-20 px-6 sm:px-10 max-w-7xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group p-6 rounded-2xl bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`text-4xl mb-4 ${feature.color} transition-transform duration-300 group-hover:scale-110`}>
                  <feature.icon size={40} className="stroke-2" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
