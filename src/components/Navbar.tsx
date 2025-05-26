import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/components/Sidebar"; // Import the NavItem type

interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
  navItems: NavItem[];
}

export function Navbar({ className, navItems, ...props }: NavbarProps) {
  const location = useLocation();

  return (
    // Hide on small screens (mobile), display as flex row on medium and larger
    <nav
      className={cn(
        "hidden md:flex items-center space-x-4 ml-4 lg:space-x-6 ", // <-- Key change: hidden md:flex
        className,
      )}
      {...props}
    >
      {/* Logo/Title remains, adjust as needed */}
      <Link to="/" className="mr-6 flex items-center space-x-2">
        <span className="font-bold inline-block">Admin Dashboard</span>
      </Link>

      {/* Map over navItems for desktop links */}
      {navItems.map((item) => (
        <Button
          key={item.to}
          variant="link"
          asChild
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary p-0",
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
          }}
        >
          <Link to={item.to}>{item.label}</Link>
        </Button>
      ))}

      {/* Right-side elements (if any) remain part of the desktop nav */}
      {/* <div className="ml-auto flex items-center space-x-4"> ... </div> */}
    </nav>
  );
}
