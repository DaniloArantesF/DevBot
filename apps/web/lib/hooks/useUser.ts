import useSWR from 'swr';
import { UserData } from 'shared/types';
import fetchJson from '@lib/fetch';
// import { User } from 'shared/session';

interface User {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  isLoggedIn: boolean;
}

export async function fetchUser(token: string) {
  return await fetchJson<UserData>(`http://localhost:8000/discord/user?token=${token}`);
}

export default function useUser({ redirectTo = '', redirectIfFound = false } = {}) {
  // TODO: refresh tokens
  const { data: user, mutate: mutateUser } = useSWR<User>('/api/user', {
    revalidateOnFocus: false,
  });

  // useEffect(() => {
  //   if (!redirectTo || !user) return;

  //   // Redirect if user is not authenticated or redirectIfFound is set
  //   if (
  //     (redirectTo && !redirectIfFound && !user?.isLoggedIn) ||
  //     (redirectIfFound && user?.isLoggedIn)
  //   ) {
  //     Router.push(redirectTo);
  //   }
  // }, [user, redirectIfFound, redirectTo]);

  return { user, mutateUser };
}
