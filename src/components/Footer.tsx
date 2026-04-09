import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Facebook, Instagram, Linkedin, Twitter, Youtube, Globe, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Company */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Company</h3>
            <ul className="space-y-2">
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/services" className="hover:text-white transition-colors">Services</Link></li>
              <li><Link to="/careers" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
            </ul>
          </div>
          
          {/* Column 2: Products */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Products</h3>
            <ul className="space-y-2">
              <li><Link to="/consumer/services/driver" className="hover:text-white transition-colors">Driver on Rent</Link></li>
              <li><Link to="/consumer/services/nanny" className="hover:text-white transition-colors">Nanny</Link></li>
              <li><Link to="/consumer/services/chef" className="hover:text-white transition-colors">Cook</Link></li>
              <li><Link to="/consumer/services/parcel-delivery" className="hover:text-white transition-colors">Parcel Delivery</Link></li>
            </ul>
          </div>
          
          {/* Column 3: Support */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Support</h3>
            <ul className="space-y-2">
              <li><Link to="/safety" className="hover:text-white transition-colors">Safety</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
            </ul>
          </div>
          
          {/* Column 4: Travel */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Travel</h3>
            <ul className="space-y-2">
              <li><Link to="/travel/multi-drop" className="hover:text-white transition-colors">Multi-drop</Link></li>
              <li><Link to="/travel/airport-rides" className="hover:text-white transition-colors">Airport Rides</Link></li>
              <li><Link to="/travel/city-rides" className="hover:text-white transition-colors">City Rides</Link></li>
            </ul>
          </div>
        </div>
        
        {/* Social Media Icons */}
        <div className="mt-12 border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <Logo />
          </div>
          <div className="flex space-x-4 mb-6 md:mb-0">
            <a href="#" className="text-gray-400 hover:text-white" aria-label="Facebook">
              <Facebook size={20} />
            </a>
            <a href="#" className="text-gray-400 hover:text-white" aria-label="Twitter">
              <Twitter size={20} />
            </a>
            <a href="#" className="text-gray-400 hover:text-white" aria-label="YouTube">
              <Youtube size={20} />
            </a>
            <a href="#" className="text-gray-400 hover:text-white" aria-label="LinkedIn">
              <Linkedin size={20} />
            </a>
            <a href="#" className="text-gray-400 hover:text-white" aria-label="Instagram">
              <Instagram size={20} />
            </a>
          </div>
          
          {/* Language and Location Selector */}
          <div className="flex space-x-4">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white flex items-center gap-2">
              <Globe size={16} />
              <span>English</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white flex items-center gap-2">
              <MapPin size={16} />
              <span>Delhi NCR</span>
            </Button>
          </div>
        </div>
        
        {/* App Store Badges */}
        <div className="mt-8 flex flex-col md:flex-row justify-center items-center gap-4">
          <a href="#" className="hover:opacity-80 transition-opacity">
            <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" className="h-10" />
          </a>
          <a href="#" className="hover:opacity-80 transition-opacity">
            <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="Download on the App Store" className="h-10" />
          </a>
        </div>
        
        {/* Copyright */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Cura. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
