"use client";

import { useState, useEffect } from "react";
import type { AuthenticatedUser } from "@/lib/auth";

export function useCurrentUser(): AuthenticatedUser | null | undefined {
  const [user, setUser] = useState<AuthenticatedUser | null | undefined>(
    undefined,
  );

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/user")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setUser(data.user ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return user;
}
