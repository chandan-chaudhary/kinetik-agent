"use client";

import { useState } from "react";
import Link from "next/link";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";

export default function Sidebar() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 border-r bg-white p-4 flex-col">
        <div className="mb-6 flex items-center gap-2">
          <div className="text-xl font-semibold">Nodebase</div>
        </div>

        <nav className="flex flex-col gap-1">
          <Link
            href="/workflow"
            className="px-3 py-2 rounded-md bg-accent/5 text-foreground font-medium"
          >
            Workflows
          </Link>
          <Link href="#" className="px-3 py-2 rounded-md hover:bg-accent/5">
            Executions
          </Link>
        </nav>

        <div className="mt-auto pt-6">
          <button className="text-sm text-muted-foreground">
            Billing Portal
          </button>
          <div className="mt-2">
            <button className="text-sm text-muted-foreground">Sign out</button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar + sheet */}
      <div className="md:hidden mb-4 flex items-center justify-between">
        <Sheet
          open={mobileNavOpen}
          onOpenChange={(open) => setMobileNavOpen(open)}
        >
          <SheetTrigger asChild>
            <button
              aria-label="Open menu"
              className="px-3 py-2 rounded-md border"
            >
              ☰
            </button>
          </SheetTrigger>

          <SheetContent side="left">
            <div className="p-4">
              <div className="mb-6 flex items-center gap-2">
                <div className="text-xl font-semibold">Nodebase</div>
              </div>

              <nav className="flex flex-col gap-1">
                <Link
                  href="/workflow"
                  className="px-3 py-2 rounded-md bg-accent/5 text-foreground font-medium"
                >
                  Workflows
                </Link>
                <Link
                  href="#"
                  className="px-3 py-2 rounded-md hover:bg-accent/5"
                >
                  Executions
                </Link>
              </nav>

              <div className="mt-6">
                <button className="text-sm text-muted-foreground">
                  Billing Portal
                </button>
              </div>
              <div className="mt-2">
                <button className="text-sm text-muted-foreground">
                  Sign out
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <div className="text-lg font-semibold">Workflows</div>
        <div />
      </div>
    </>
  );
}
