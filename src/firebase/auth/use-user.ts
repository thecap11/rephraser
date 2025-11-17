
"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { useAuth } from "..";

export const useUser = () => {
  const auth = useAuth();
  const [user, isLoading, error] = useAuthState(auth);

  return { user, isLoading, error };
};
