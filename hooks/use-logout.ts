'use client';

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function useLogout() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await authClient.signOut();
      router.replace("/");
    } catch {
      setIsLoading(false);
    }
  };

  return {
    logout: handleLogout,
    isLoading
  };
}