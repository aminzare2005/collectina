"use client";

import { useLogout } from "@/hooks/use-logout";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const { logout, isLoading } = useLogout();

  return (
    <Button
      onClick={logout}
      disabled={isLoading}
      variant="destructive"
      size="lg"
    >
      <LogOut />
      لاگ اوت
    </Button>
  );
}
