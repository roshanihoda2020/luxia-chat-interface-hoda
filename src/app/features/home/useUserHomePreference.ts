import { useCallback, useState, type SetStateAction } from "react";

/**
 * State for one per-user Home preference. When `userId` changes, the value is
 * re-read for the new user during that same render (React's "adjust state
 * while rendering" pattern), so no render — and no effect — ever pairs one
 * user's preference with another user's id.
 */
export function useUserHomePreference<T>(
  userId: string,
  read: (userId: string) => T,
): [T, (update: SetStateAction<T>) => void] {
  const [state, setState] = useState(() => ({ userId, value: read(userId) }));
  let current = state;
  if (state.userId !== userId) {
    current = { userId, value: read(userId) };
    setState(current);
  }
  const set = useCallback((update: SetStateAction<T>) => {
    setState((prev) => ({
      userId: prev.userId,
      value: typeof update === "function" ? (update as (value: T) => T)(prev.value) : update,
    }));
  }, []);
  return [current.value, set];
}
