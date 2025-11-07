'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { searchLocalLocations, getCachedLocation, setCachedLocation } from '@/lib/locations';

interface LocationSuggestion {
  display_name?: string;
  name: string;
  type: string;
  isLocal?: boolean;
}

interface LocationAutocompleteProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function LocationAutocomplete({
  id,
  value,
  onChange,
  placeholder = 'Enter city, state, or country',
  disabled = false,
  className,
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [hasInteracted, setHasInteracted] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch location suggestions with hybrid approach (local + API)
  useEffect(() => {
    // Only fetch suggestions if user has interacted with the input
    if (!hasInteracted || !value || value.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    // Step 1: Instant local search
    const localResults = searchLocalLocations(value, 5);
    const localSuggestions = localResults.map(loc => ({
      name: loc.name,
      type: loc.type,
      display_name: loc.name,
      isLocal: true,
    }));

    // Show local results immediately
    if (localSuggestions.length > 0) {
      setSuggestions(localSuggestions);
      setIsOpen(true);
    }

    // Step 2: Fetch from API only if needed (with reduced debounce)
    const delayDebounceFn = setTimeout(async () => {
      // Check cache first
      const cached = getCachedLocation(value);
      if (cached) {
        const combined = [...localSuggestions, ...cached].slice(0, 5);
        setSuggestions(combined);
        setIsOpen(combined.length > 0);
        return;
      }

      // Only call API if we have less than 3 local results
      if (localSuggestions.length < 3) {
        setIsLoading(true);
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?` +
              new URLSearchParams({
                q: value,
                format: 'json',
                addressdetails: '1',
                limit: '3',
                'accept-language': 'en',
              }),
            {
              headers: {
                'User-Agent': 'JobPostingPlatform/1.0',
                'Accept-Language': 'en',
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            const apiSuggestions = data.map((item: any) => ({
              display_name: item.display_name,
              name: formatLocationName(item),
              type: item.type,
              isLocal: false,
            }));

            // Cache API results
            setCachedLocation(value, apiSuggestions);

            // Combine local + API results, remove duplicates
            const combined = [...localSuggestions, ...apiSuggestions]
              .filter((item, index, self) =>
                index === self.findIndex((t) => t.name === item.name)
              )
              .slice(0, 5);

            setSuggestions(combined);
            setIsOpen(combined.length > 0);
          }
        } catch (error) {
          console.error('Error fetching location suggestions:', error);
          // Keep local results on error
        } finally {
          setIsLoading(false);
        }
      }
    }, 300); // Reduced to 300ms for faster response

    return () => clearTimeout(delayDebounceFn);
  }, [value, hasInteracted]);

  // Format location name from API response
  const formatLocationName = (item: any): string => {
    const address = item.address;
    const parts: string[] = [];

    if (address.city) parts.push(address.city);
    else if (address.town) parts.push(address.town);
    else if (address.village) parts.push(address.village);

    if (address.state) parts.push(address.state);
    if (address.country) parts.push(address.country);

    return parts.join(', ') || item.display_name.split(',').slice(0, 3).join(',');
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          selectSuggestion(suggestions[selectedIndex].name);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const selectSuggestion = (locationName: string) => {
    onChange(locationName);
    setIsOpen(false);
    setSuggestions([]);
    setSelectedIndex(-1);
    setHasInteracted(false); // Reset interaction after selection
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasInteracted(true);
    onChange(e.target.value);
  };

  const handleFocus = () => {
    setHasInteracted(true);
    if (suggestions.length > 0 && value.length >= 2) {
      setIsOpen(true);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          id={id}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={cn('pl-10 pr-10', className)}
          autoComplete="off"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
          <ul className="py-1">
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                onClick={() => selectSuggestion(suggestion.name)}
                className={cn(
                  'px-3 py-2 cursor-pointer hover:bg-accent transition-colors',
                  selectedIndex === index && 'bg-accent'
                )}
              >
                <div className="flex items-start gap-2">
                  {suggestion.isLocal ? (
                    <Zap className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  ) : (
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate flex items-center gap-1">
                      {suggestion.name}
                      {suggestion.isLocal && (
                        <span className="text-xs text-primary">• Popular</span>
                      )}
                    </div>
                    {suggestion.display_name && suggestion.display_name !== suggestion.name && (
                      <div className="text-xs text-muted-foreground truncate">
                        {suggestion.display_name}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Helper text */}
      {value.length > 0 && value.length < 2 && (
        <p className="text-xs text-muted-foreground mt-1">
          Type at least 2 characters for suggestions
        </p>
      )}
    </div>
  );
}
