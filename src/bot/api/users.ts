import { User } from '../types';
import { SlackClient } from './client';

// TODO: Move to Redis cache
let userData: User[] = [];
let lastUpdated: number | undefined;

export async function getUsers({
  useCache = true,
}: { useCache?: boolean } = {}): Promise<User[]> {
  const yesterday = new Date(Date.now() - 24 * 7 * 60 * 60 * 1000).getTime();
  if (
    useCache &&
    lastUpdated &&
    lastUpdated > yesterday &&
    !!userData?.length
  ) {
    return userData;
  }
  try {
    const client = new SlackClient();
    const data = await client.users.list();
    userData =
      data.members
        ?.filter((m) => !m.deleted && !m.is_bot && !!m.profile && !!m.id)
        .filter((m) => m.name !== 'slackbot')
        .map(
          (m): User => ({
            ...m,
            id: m.id!,
            profile: m.profile!,
            hasImage: hasImageLazy(m as User),
          }),
        ) || [];
    lastUpdated = Date.now();
    return userData.slice();
  } catch (err) {
    console.log('fetch Error:', err);
    return [];
  }
}

async function isRedirected(url: string) {
  const data = await fetch(url, { method: 'HEAD' });
  return data.redirected;
}

async function hasImage(user: User) {
  if (user.profile?.image_original) {
    return true;
  }
  const gravatarUrl = user.profile?.image_192;
  return !!gravatarUrl && !(await isRedirected(gravatarUrl));
}

const hasImageLazy = (user: User) => async () => {
  if (user.hasImage !== undefined) {
    return user.hasImage();
  }
  const value = await hasImage(user);
  user.hasImage = async () => value;
  return value;
};

export async function getUser({ id }: { id: string }) {
  const users = await getUsers();
  return users.find((u) => u.id === id);
}