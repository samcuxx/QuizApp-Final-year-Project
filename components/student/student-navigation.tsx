"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  BookOpen,
  Trophy,
  Settings,
  LogOut,
  Menu,
  X,
  GraduationCap,
} from "lucide-react";

import { signOut } from "@/lib/auth/client-auth-helpers";
import { Profile } from "@/lib/types/database";

interface StudentNavigationProps {
  profile: Profile;
}

export default function StudentNavigation({ profile }: StudentNavigationProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/student/dashboard", icon: GraduationCap },
    { name: "My Classes", href: "/student/classes", icon: BookOpen },
    { name: "Quiz Results", href: "/student/results", icon: Trophy },
    { name: "Profile", href: "/student/profile", icon: Settings },
  ];

  const handleSignOut = async () => {
    try {
      const result = await signOut();
      if (result.success) {
        toast.success("Signed out successfully");
        router.push("/");
      } else {
        toast.error("Failed to sign out");
      }
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          {/* Logo and primary navigation */}
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link
                href="/student/dashboard"
                className="text-xl font-bold text-gray-900 dark:text-white"
              >
                Quiz App
              </Link>
              <span className="ml-2 text-sm bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">
                Student
              </span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="inline-flex items-center gap-2 px-1 pt-1 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User menu and theme switcher */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            <ThemeSwitcher />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {profile.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium">{profile.name}</div>
                    {profile.index_number && (
                      <div className="text-xs text-muted-foreground">
                        {profile.index_number}
                      </div>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{profile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {profile.email}
                  </p>
                  {profile.index_number && (
                    <p className="text-sm text-muted-foreground">
                      ID: {profile.index_number}
                    </p>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href="/student/profile"
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-red-600 dark:text-red-400"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="border-t border-gray-200 dark:border-gray-700 pb-3 pt-4">
            <div className="flex items-center px-4">
              <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {profile.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800 dark:text-gray-200">
                  {profile.name}
                </div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {profile.email}
                </div>
                {profile.index_number && (
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    ID: {profile.index_number}
                  </div>
                )}
              </div>
              <div className="ml-auto">
                <ThemeSwitcher />
              </div>
            </div>
            <div className="mt-3 space-y-1 px-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-base font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-base font-medium text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
