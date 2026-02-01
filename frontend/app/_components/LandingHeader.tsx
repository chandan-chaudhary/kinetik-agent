import { Button } from "@/components/ui/button";
import Image from "next/image";

const Header = () => {
  const navLinks = ["Home", "Services", "Features", "Pricing", "Contact"];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/kinetik-application-logo.png"
            alt="Kinetik Logo"
            width={40}
            height={40}
            className="w-10 h-10"
          />
          <span className="text-2xl font-bold text-foreground tracking-tight">
            KINETIK
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase()}`}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link}
            </a>
          ))}
        </nav>

        <Button variant="default" size="sm" className="font-medium">
          Get Support
        </Button>
      </div>
    </header>
  );
};

export default Header;
