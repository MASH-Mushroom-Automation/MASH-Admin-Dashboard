"use client";

import { PanelLeftOpen, PanelLeftClose, Menu, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { useEffect, useState } from "react";

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export default function Navbar({}: NavbarProps) {
  const { toggleSidebar, state } = useSidebar();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Sync theme with localStorage and document class
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark";
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <div className="h-[53px] bg-background border-b border-border flex items-center justify-between px-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => toggleSidebar()}
        className="text-foreground hover:bg-accent p-3"
        title="Toggle sidebar"
      >
        <span className="md:hidden">
          <Menu className="w-5 h-5" />
        </span>
        <span className="hidden md:inline-flex ml-9">
          {state === "expanded" ? (
            <PanelLeftClose className="w-5 h-5" />
          ) : (
            <PanelLeftOpen className="w-5 h-5" />
          )}
        </span>
      </Button>

      {/* Theme Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="text-foreground hover:bg-accent p-3"
        title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        {theme === "light" ? (
          <Moon className="w-5 h-5" />
        ) : (
          <Sun className="w-5 h-5" />
        )}
      </Button>
    </div>
  );
}
