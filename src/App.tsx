// src/App.tsx
import { useState } from "react"; // Import useState
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import { Navbar } from "@/components/Navbar";
import { Sidebar, NavItem } from "@/components/Sidebar"; // Import Sidebar and NavItem
import { Button } from "@/components/ui/button"; // Import Button
import { Menu } from "lucide-react"; // Import Menu icon
import { Home } from "@/pages/Home";
import { ProductsPage } from "@/pages/ProductsPage";
import { CollectionsPage } from "@/pages/CollectionsPage";
import { ProductFormPage } from "@/pages/ProductFormPage";
import { CollectionFormPage } from "@/pages/CollectionFormPage";
import { CountriesPage } from "@/pages/CountriesPage";
import { CountryFormPage } from "@/pages/CountryFormPage";
import { CurrenciesPage } from "@/pages/CurrenciesPage";
import { CurrencyFormPage } from "@/pages/CurrencyFormPage";
import { Toaster } from "@/components/ui/sonner";

// Define navigation items in one place
const navItems: NavItem[] = [
  { to: "/products", label: "Products" },
  { to: "/collections", label: "Collections" },
  { to: "/countries", label: "Countries" },
  { to: "/currencies", label: "Currencies" },
  // Add more items here if needed
];

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for sidebar

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        {/* Pass sidebar state management props */}
        <Sidebar
          navItems={navItems}
          isOpen={isSidebarOpen}
          onOpenChange={setIsSidebarOpen}
        />
        <div className="flex flex-col min-h-screen">
          <header className="sticky top-0 z-40 w-full border-b bg-background">
            <div className="container flex h-16 items-center justify-between">
              {/* Hamburger Menu Trigger - Visible only on mobile */}
              <div className="md:hidden">
                {" "}
                {/* Wrap trigger */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(true)}
                  aria-label="Open sidebar"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </div>

              {/* Desktop Navbar - Hidden on mobile */}
              <Navbar navItems={navItems} className="flex-1" />

              {/* Mode Toggle - Always visible */}
              <div className="ml-4 md:ml-4 mr-4 flex justify-center">
                {/* Adjust margin */}
                <ModeToggle />
              </div>
            </div>
          </header>
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              {/* Products */}
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/new" element={<ProductFormPage />} />
              <Route path="/products/:id" element={<ProductFormPage />} />
              {/* Collections */}
              <Route path="/collections" element={<CollectionsPage />} />
              <Route path="/collections/new" element={<CollectionFormPage />} />
              <Route path="/collections/:id" element={<CollectionFormPage />} />
              {/* Countries */}
              <Route path="/countries" element={<CountriesPage />} />
              <Route path="/countries/new" element={<CountryFormPage />} />
              <Route path="/countries/:code" element={<CountryFormPage />} />
              {/* Currencies */}
              <Route path="/currencies" element={<CurrenciesPage />} />
              <Route path="/currencies/new" element={<CurrencyFormPage />} />
              <Route path="/currencies/:code" element={<CurrencyFormPage />} />
              {/* <Route path="*" element={<NotFoundPage />} /> */}
            </Routes>
          </main>
          <Toaster />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
