import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/TabBar';
import { colors } from '@/theme';

const TabsLayout = () => (
  <Tabs
    tabBar={(props) => <TabBar {...props} />}
    screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}>
    <Tabs.Screen name="index" />
    <Tabs.Screen name="friends" />
  </Tabs>
);

export default TabsLayout;
