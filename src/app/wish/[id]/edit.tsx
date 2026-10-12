import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { WishForm } from '@/components/WishForm';
import { useUpdateWish, useWish } from '@/data/hooks';
import { colors } from '@/theme';

const EditWish = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: wish } = useWish(id);
  const update = useUpdateWish();

  if (!wish) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  return <WishForm wish={wish} onSave={(input) => update.mutateAsync({ id, input })} />;
};

export default EditWish;
