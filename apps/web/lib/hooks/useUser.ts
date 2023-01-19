import { useEffect } from 'react';
import Router from 'next/router';
import useSWR from 'swr';
import { User } from '@api/user';

export default function useUser({ redirectTo = '', redirectIfFound = false } = {}) {
  // TODO: refresh tokens
  const { data: user, mutate: mutateUser } = useSWR<User>('/api/user', {
    revalidateOnFocus: false,
  });

  useEffect(() => {
    if (!redirectTo || !user) return;

    // Redirect if user is not authenticated or redirectIfFound is set
    if (
      (redirectTo && !redirectIfFound && !user?.isLoggedIn) ||
      (redirectIfFound && user?.isLoggedIn)
    ) {
      Router.push(redirectTo);
    }
  }, [user, redirectIfFound, redirectTo]);

  return { user, mutateUser };
}
