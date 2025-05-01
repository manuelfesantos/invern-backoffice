// src/pages/Home.tsx
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function Home() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20">
      <h1 className="text-4xl font-bold mb-4">
        Welcome to Invern Spirit Backoffice!!
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Edit your products and collections using the navigation above.
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <Link to="/products">View Products</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/collections">Browse Collections</Link>
        </Button>
      </div>
    </div>
  );
}
