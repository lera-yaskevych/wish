import { WishForm } from '@/components/WishForm';
import { useCreateWish } from '@/data/hooks';

const NewWish = () => {
  const create = useCreateWish();
  return <WishForm onSave={create.mutateAsync} />;
};

export default NewWish;
