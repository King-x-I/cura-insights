
import React from 'react';
import { Car, ChefHat, Baby, Truck, HeartPulse, Home } from 'lucide-react';
import { ServiceCard } from '@/components/consumer/ServiceCard';

const services = [
  { 
    id: 'driver', 
    title: 'Driver Service', 
    description: 'Hire a professional driver for your travel needs',
    icon: <Car className="h-8 w-8" />,
    link: '/consumer/services/driver',
    color: 'bg-blue-500'
  },
  { 
    id: 'caretaker', 
    title: 'Caretaker', 
    description: 'Professional care for elderly or patients',
    icon: <HeartPulse className="h-8 w-8" />,
    link: '/consumer/services/caretaker',
    color: 'bg-purple-500'
  },
  { 
    id: 'nanny', 
    title: 'Nanny Service', 
    description: 'Experienced nannies for childcare',
    icon: <Baby className="h-8 w-8" />,
    link: '/consumer/services/nanny',
    color: 'bg-pink-500'
  },
  { 
    id: 'house-helper', 
    title: 'House Helper', 
    description: 'Assistance with household chores',
    icon: <Home className="h-8 w-8" />,
    link: '/consumer/services/house-helper',
    color: 'bg-green-500'
  },
  { 
    id: 'chef', 
    title: 'Chef Service', 
    description: 'Professional chefs for your events',
    icon: <ChefHat className="h-8 w-8" />,
    link: '/consumer/services/chef',
    color: 'bg-orange-500'
  },
  { 
    id: 'parcel-delivery', 
    title: 'Parcel Delivery', 
    description: 'Reliable parcel delivery service',
    icon: <Truck className="h-8 w-8" />,
    link: '/consumer/services/parcel-delivery',
    color: 'bg-yellow-500'
  }
];

export function ServicesGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {services.map((service) => (
        <ServiceCard
          key={service.id}
          title={service.title}
          description={service.description}
          icon={service.icon}
          link={service.link}
          color={service.color}
        />
      ))}
    </div>
  );
}
