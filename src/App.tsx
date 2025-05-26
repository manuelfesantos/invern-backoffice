import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import { Navbar } from "@/components/Navbar";
import { Sidebar, NavItem } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
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

// --- Import New Pages ---
import { OrdersPage } from "@/pages/OrdersPage";
import { CartsPage } from "@/pages/CartsPage";
import { UsersPage } from "@/pages/UsersPage";
import { CartDetailPage } from "@/pages/CartDetailPage.tsx";
import { UserDetailPage } from "@/pages/UserDetailPage.tsx";
// import { OrderDetailPage } from "@/pages/OrderDetailPage"; // Placeholder for future
// import { CartDetailPage } from "@/pages/CartDetailPage"; // Placeholder for future
// import { UserFormPage } from "@/pages/UserFormPage"; // Placeholder for future

// Define navigation items in one place
const navItems: NavItem[] = [
  { to: "/products", label: "Products" },
  { to: "/collections", label: "Collections" },
  { to: "/countries", label: "Countries" },
  { to: "/currencies", label: "Currencies" },
  // --- Add New Nav Items ---
  { to: "/orders", label: "Orders" },
  { to: "/carts", label: "Carts" },
  { to: "/users", label: "Users" },
];

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        <Sidebar
          navItems={navItems}
          isOpen={isSidebarOpen}
          onOpenChange={setIsSidebarOpen}
        />
        <div className="flex flex-col min-h-screen">
          <header className="sticky top-0 z-40 w-full border-b bg-background">
            <div className="container flex h-16 items-center justify-between">
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(true)}
                  aria-label="Open sidebar"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </div>
              <Navbar navItems={navItems} className="flex-1" />
              <div className="ml-auto flex items-center">
                {" "}
                {/* Removed justify-center and mr-4 */}
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
              {/* --- Add New Routes --- */}
              <Route path="/orders" element={<OrdersPage />} />
              {/* <Route path="/orders/:id" element={<OrderDetailPage />} /> */}
              <Route path="/carts" element={<CartsPage />} />
              <Route path="/carts/:id" element={<CartDetailPage />} />{" "}
              {/* <-- UPDATED */}
              <Route path="/users" element={<UsersPage />} />
              <Route path="/users/:id" element={<UserDetailPage />} />
            </Routes>
          </main>
          <Toaster />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
