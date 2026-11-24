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

export const useMyReservations = () =>
  useQuery({ queryKey: ['reservations', 'mine'], queryFn: api.listMyReservations });

export const usePeopleSearch = (query: string) =>
  useQuery({
    queryKey: ['search', query],
    queryFn: () => api.searchPeople(query),
    enabled: query.trim().length > 0,
    placeholderData: (previous) => previous,
  });

export const useInviteCode = () =>
  useQuery({ queryKey: ['invite-code'], queryFn: api.getInviteCode, staleTime: Infinity });

// Fetched before anyone taps Share: phone browsers only open the share sheet straight
// from a tap, not after waiting on the network.
export const useShareToken = (userId: string | undefined) =>
  useQuery({
    queryKey: ['share-token', userId],
    queryFn: () => api.getShareToken(userId!),
    enabled: !!userId,
    staleTime: Infinity,
  });

// `guestKey` is undefined while the device's guest key is still being read.
export const useSharedList = (token: string, guestKey: string | null | undefined) =>
  useQuery({
    queryKey: ['shared', token, guestKey],
    queryFn: () => api.getSharedList(token, guestKey ?? null),
    enabled: !!token && guestKey !== undefined,
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
export const useReserveAsGuest = () => useWrite(api.reserveAsGuest);
export const useUnreserveAsGuest = () => useWrite(api.unreserveAsGuest);
export const useReleaseGuestReservation = () => useWrite(api.releaseGuestReservation);
