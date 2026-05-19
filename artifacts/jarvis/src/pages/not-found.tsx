import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-grid">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 text-primary/40 mx-auto mb-4"
          style={{ filter: "drop-shadow(0 0 8px rgba(0,229,255,0.3))" }} />
        <p className="text-xs text-primary/60 tracking-[0.3em] uppercase mb-2">Error 404</p>
        <h1 className="text-4xl font-bold text-primary jarvis-text-glow tracking-widest mb-2">SECTOR NOT FOUND</h1>
        <p className="text-muted-foreground/60 text-sm tracking-wide mb-8">
          The requested location does not exist in the system.
        </p>
        <Link href="/">
          <Button className="bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 tracking-wider">
            <Home className="w-4 h-4 mr-2" /> Return to Base
          </Button>
        </Link>
      </div>
    </div>
  );
}
