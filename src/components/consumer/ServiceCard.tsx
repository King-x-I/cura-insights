
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface ServiceCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  color: string;
}

export function ServiceCard({ title, description, icon, link, color }: ServiceCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-2 ${color} bg-opacity-15 text-white`}>
          {icon}
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-gray-500">
        Available in your area
      </CardContent>
      <CardFooter className="pt-2">
        <Button asChild className="w-full">
          <Link to={link}>Book Now</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
