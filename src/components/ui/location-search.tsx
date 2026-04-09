
import * as React from "react";
import { useGooglePlacesAutocomplete } from "@/hooks/useGoogleMaps";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CommandInput, CommandList, CommandItem, CommandGroup, Command } from "@/components/ui/command";
import { Check, Loader2, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface LocationSearchProps {
  value: string;
  onChange: (location: string) => void;
  placeholder?: string;
  onLocationSelect?: (placeId: string, address: string) => void;
  className?: string;
}

export function LocationSearch({
  value,
  onChange,
  placeholder = "Search for a location",
  onLocationSelect,
  className,
}: LocationSearchProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);
  const {
    isLoaded,
    placePredictions,
    isSearching,
    getPlacePredictions,
    getPlaceDetails,
    error
  } = useGooglePlacesAutocomplete();

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  React.useEffect(() => {
    if (isLoaded && inputValue && inputValue.length > 2) {
      const timer = setTimeout(() => {
        console.log("Getting place predictions for:", inputValue);
        getPlacePredictions(inputValue);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isLoaded, inputValue, getPlacePredictions]);

  // Show error toast if maps failed to load
  React.useEffect(() => {
    if (error) {
      console.error("Maps loading error:", error);
      toast.error("Maps could not be loaded. Some features may not work.");
    }
  }, [error]);

  const handleSelection = async (placeId: string, description: string) => {
    console.log("Selected place:", description, "with ID:", placeId);
    setInputValue(description);
    onChange(description);
    setOpen(false);

    if (onLocationSelect) {
      try {
        const placeDetails = await getPlaceDetails(placeId);
        if (placeDetails) {
          console.log("Got place details:", placeDetails);
          onLocationSelect(placeId, description);
        }
      } catch (error) {
        console.error("Error getting place details:", error);
        toast.error("Could not get location details");
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    if (!value) {
      onChange("");
    }
  };

  const handleClear = () => {
    setInputValue("");
    onChange("");
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div>
              <Input
                placeholder={placeholder}
                value={inputValue}
                onChange={handleInputChange}
                className="pl-9 pr-10"
                onFocus={() => inputValue.length > 2 && setOpen(true)}
              />
              {inputValue && (
                <Button
                  variant="ghost"
                  type="button"
                  className="absolute right-0 top-0 h-full px-3 py-2"
                  onClick={handleClear}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
            <Command>
              <CommandList>
                {!isLoaded ? (
                  <CommandItem disabled>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading maps...
                  </CommandItem>
                ) : error ? (
                  <CommandItem disabled className="text-destructive">
                    Maps could not be loaded
                  </CommandItem>
                ) : isSearching ? (
                  <CommandItem disabled>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </CommandItem>
                ) : placePredictions.length === 0 && inputValue ? (
                  <CommandItem disabled>No locations found</CommandItem>
                ) : (
                  <CommandGroup>
                    {placePredictions.map((prediction) => (
                      <CommandItem
                        key={prediction.place_id}
                        value={prediction.description}
                        onSelect={() => handleSelection(prediction.place_id, prediction.description)}
                      >
                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{prediction.description}</span>
                        {prediction.description === inputValue && (
                          <Check className="ml-auto h-4 w-4 text-primary" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
