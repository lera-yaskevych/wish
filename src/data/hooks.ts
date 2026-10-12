import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, type WishInput } from './index';

export const useMyWishes = () => useQuery({ queryKey: ['wishes', 'mine'], queryFn: api.listMyWishes });

export const useArchive = () => useQuery({ queryKey: ['wishes', 'archive'], queryFn: api.listArchive });

export const useWish = (id: string) => useQuery({ queryKey: ['wish', id], queryFn: () => api.getWish(id) });

export const useFollowing = () => useQuery({ queryKey: ['following'], queryFn: api.listFollowing });

export const useProfile = (userId: string | undefined) =>
  useQuery({
    queryKey: ['profile', userId],
    queryFn: () => api.getProfile(userId!),
    enabled: !!userId,
  });

export const useWishesOf = (userId: string) =>
  useQuery({ queryKey: ['wishes', 'of', userId], queryFn: () => api.listWishesOf(userId) });

export const usePeopleSearch = (query: string) =>
  useQuery({
    queryKey: ['search', query],
    queryFn: () => api.searchPeople(query),
    enabled: query.trim().length > 0,
    placeholderData: (previous) => previous,
  });

// Lists are tiny, so every write simply refreshes whatever is on screen.
const useWrite = <TArgs, TResult>(write: (args: TArgs) => Promise<TResult>) => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: write, onSuccess: () => queryClient.invalidateQueries() });
};

export const useCreateWish = () => useWrite(api.createWish);
export const useUpdateWish = () =>
  useWrite(({ id, input }: { id: string; input: WishInput }) => api.updateWish(id, input));
export const useDeleteWish = () => useWrite(api.deleteWish);
export const useFulfillWish = () => useWrite(api.fulfillWish);
export const useRestoreWish = () => useWrite(api.restoreWish);
export const useFollow = () => useWrite(api.follow);
export const useUnfollow = () => useWrite(api.unfollow);
export const useReserve = () => useWrite(api.reserve);
export const useUnreserve = () => useWrite(api.unreserve);
