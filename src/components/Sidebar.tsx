// src/components/Sidebar.tsx
import { Link, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetClose } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area"; // Optional: for many links
import { cn } from "@/lib/utils";

// Define the structure for navigation items
export interface NavItem {
  to: string;
  label: string;
  disabled?: boolean;
}

interface SidebarProps {
  navItems: NavItem[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Sidebar({ navItems, isOpen, onOpenChange }: SidebarProps) {
  const location = useLocation();

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="pr-0 w-[260px] sm:max-w-xs">
        {/* Optional Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <Link
            to="/"
            className="flex items-center space-x-2"
            onClick={() => onOpenChange(false)} // Close on logo click
          >
            <span className="font-bold inline-block">Admin Dashboard</span>
          </Link>
        </div>

        {/* Navigation Links */}
        <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
          <div className="flex flex-col space-y-3">
            {navItems.map((item) => (
              <SheetClose key={item.to} asChild>
                <Link
                  to={item.to}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    location.pathname === item.to
                      ? "text-foreground" // Active link style
                      : "text-muted-foreground", // Inactive link style
                    item.disabled && "cursor-not-allowed opacity-80",
                  )}
                  aria-disabled={item.disabled}
                  onClick={(e) => {
                    if (item.disabled) {
                      e.preventDefault();
                    }
                    // No need to manually close here, SheetClose handles it
                  }}
                >
                  {item.label}
                </Link>
              </SheetClose>
            ))}
          </div>
        </ScrollArea>
        {/* Optional Footer */}
        {/* <SheetFooter> ... </SheetFooter> */}
      </SheetContent>
    </Sheet>
  );
}
