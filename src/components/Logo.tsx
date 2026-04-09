
import React from "react";

export function Logo({ size = 'regular' }: { size?: 'small' | 'regular' | 'large' }) {
  const sizeClasses = {
    small: "text-xl md:text-2xl",
    regular: "text-2xl md:text-3xl",
    large: "text-4xl md:text-5xl"
  };
  
  return (
    <div className="font-bold flex items-center">
      <span 
        className={`
          ${sizeClasses[size]} 
          bg-gradient-to-r from-primary to-secondary 
          bg-clip-text text-transparent 
          animate-background-shine 
          drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.2)]
          dark:drop-shadow-[0_1.2px_1.2px_rgba(255,255,255,0.1)]
          hover:opacity-90 transition-opacity
        `}
      >
        Cura
      </span>
    </div>
  );
}
