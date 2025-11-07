'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CURRENCY_OPTIONS } from '@/lib/constants';

interface CurrencySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function CurrencySelect({ value, onValueChange, disabled }: CurrencySelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedCurrency = CURRENCY_OPTIONS.find((currency) => currency.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedCurrency ? selectedCurrency.label : 'Select currency...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" side="bottom" sideOffset={4}>
        <Command>
          <CommandInput placeholder="Search currency..." />
          <CommandList>
            <CommandEmpty>No currency found.</CommandEmpty>
            <CommandGroup>
              {CURRENCY_OPTIONS.map((currency) => (
                <CommandItem
                  key={currency.value}
                  value={currency.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue.toUpperCase());
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === currency.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {currency.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
