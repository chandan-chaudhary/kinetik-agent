"use client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Link from "next/link";
import { useUser } from "@/contexts/UserContext";
import { UserDisplay } from "@/components/UserDisplay";
import { BadgeDollarSign, Mail, Menu, Sparkles } from "lucide-react";
import BrandLockup from "./BrandLockup";

const Header = () => {
  const navLinks = ["Features", "Pricing", "Contact"];
  const { user, isLoading } = useUser();

  const navMeta: Record<
    string,
    { icon: React.ComponentType<{ className?: string }> }
  > = {
    Features: { icon: Sparkles },
    Pricing: { icon: BadgeDollarSign },
    Contact: { icon: Mail },
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <BrandLockup variant="desktop" />

        <nav className="hidden md:flex items-center gap-12">
          {navLinks.map((link) => (
            <Link
              key={link}
              href={`#${link.toLowerCase()}`}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          {isLoading ? (
            <div className="w-20 h-9 bg-muted/50 rounded animate-pulse" />
          ) : user ? (
            <UserDisplay user={user} isLoading={isLoading} variant="header" />
          ) : (
            <Link href="/login">
              <Button variant="default" size="sm" className="font-medium">
                Login
              </Button>
            </Link>
          )}
        </div>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Menu className="h-6 w-6" />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[86%] border-l border-border/80 p-0 sm:max-w-sm"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
                <SheetDescription>Mobile navigation menu</SheetDescription>
              </SheetHeader>

              <div className="flex h-full flex-col bg-card">
                <div className="border-b border-border/70 px-5 py-5 pr-12">
                  <BrandLockup variant="mobile" />
                </div>

                <nav className="flex-1 space-y-1 px-3 py-4">
                  {navLinks.map((link) => {
                    const Icon = navMeta[link]?.icon ?? Sparkles;
                    return (
                      <SheetClose asChild key={link}>
                        <Link
                          href={`#${link.toLowerCase()}`}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          <Icon className="h-4 w-4" />
                          <span>{link}</span>
                        </Link>
                      </SheetClose>
                    );
                  })}
                </nav>

                <div className="border-t border-border/70 px-4 py-4">
                  {isLoading ? (
                    <div className="h-12 w-full rounded-lg bg-muted/50 animate-pulse" />
                  ) : user ? (
                    <UserDisplay
                      user={user}
                      isLoading={isLoading}
                      variant="sidebar"
                    />
                  ) : (
                    <SheetClose asChild>
                      <Link href="/login" className="block">
                        <Button
                          variant="default"
                          className="w-full font-medium"
                        >
                          Login
                        </Button>
                      </Link>
                    </SheetClose>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
