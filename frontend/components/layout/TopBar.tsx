'use client';

import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';

interface TopBarProps {
  onMenuToggle: () => void;
}

export const TopBar = ({ onMenuToggle }: TopBarProps) => {
  return (
    <header className="sticky top-0 z-30 h-12 border-b border-border/60 bg-card/95 backdrop-blur-md flex items-center px-4 sm:px-6 lg:hidden">
      <button
        onClick={onMenuToggle}
        className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <Menu className="h-[18px] w-[18px]" />
      </button>
    </header>
  );
};

export default TopBar;
