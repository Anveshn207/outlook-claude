"use client";

import { useRouter } from "next/navigation";
import { Menu, Search, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { Input } from "@/components/ui/input";

interface NavbarProps {
  title: string;
  onMenuClick: () => void;
}

export function Navbar({ title, onMenuClick }: NavbarProps) {
  const router = useRouter();
  const { user } = useAuthStore();

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
    : "U";

  const handleSearchFocus = () => {
    router.push("/search");
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-white px-4 sm:px-6">
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      </div>

      {/* Right: search, notifications, avatar */}
      <div className="flex items-center gap-3">
        <div
          className="relative hidden cursor-pointer sm:block"
          onClick={handleSearchFocus}
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search candidates..."
            className="h-9 w-56 cursor-pointer bg-muted pl-9 text-sm"
            readOnly
          />
        </div>

        <button className="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
        </button>

        <div
          className={cn(
            "hidden h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground sm:flex",
          )}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
