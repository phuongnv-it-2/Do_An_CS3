  import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

  const CustomTabItem = ({ label, icon, isFocused, onPress }: any) => (
    <TouchableOpacity onPress={onPress} style={styles.tabBtn}>
      <Text style={{ fontSize: 22, opacity: isFocused ? 1 : 0.5 }}>{icon}</Text>
      <Text style={[styles.tabLabel, isFocused && { color: '#FFF' }]}>{label}</Text>
    </TouchableOpacity>
  );

  export default function TabLayout() {
    const colorScheme = useColorScheme();
    const tintColor = Colors[colorScheme ?? 'light'].tint;

    return (
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' }, 
        }}
        tabBar={({ state, descriptors, navigation }) => {
          return (
            <View style={styles.bottomTab}>
              <CustomTabItem
                label="Tổng quan"
                icon="🏠"
                isFocused={state.index === 0}
                onPress={() => navigation.navigate('HomeScreen')}
              />

              <CustomTabItem
                label="Sổ giao dịch"
                icon="📓"
                isFocused={state.index === 1}
                onPress={() => navigation.navigate('index')}
              />

              <View style={styles.fabContainer}>
                <TouchableOpacity 
                  style={styles.fab} 
                  activeOpacity={0.8}
                  onPress={() => console.log("Mở màn hình thêm giao dịch")}
                >
                  <Text style={styles.fabText}>+</Text>
                </TouchableOpacity>
              </View>

              <CustomTabItem
                label="Ngân sách"
                icon="📊"
                isFocused={false}
                onPress={() => {}}
              />

              <CustomTabItem
                label="Tài khoản"
                icon="👤"
                isFocused={false}
                onPress={() => {}}
              />
            </View>
          );
        }}
      >
        <Tabs.Screen name="HomeScreen" options={{ title: 'Home' }} />
        <Tabs.Screen name="index" options={{ title: 'Example' }} />
        <Tabs.Screen name="WalletScreen" options={{ href: null }} /> 
      </Tabs>
    );
  }

  const styles = StyleSheet.create({
    bottomTab: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: Platform.OS === 'ios' ? 85 : 70,
      backgroundColor: '#1C1C1E', // Dark mode theo ảnh
      flexDirection: 'row',
      borderTopWidth: 0.5,
      borderTopColor: '#38383A',
      paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    },
    tabBtn: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tabLabel: {
      color: '#8E8E93',
      fontSize: 10,
      marginTop: 4,
    },
    fabContainer: {
      flex: 1,
      alignItems: 'center',
      marginTop: -25, // Đẩy nút FAB lên cao
    },
    fab: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: '#2ECC71', // Màu xanh lá Money Lover
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 4,
      borderColor: '#000', // Khớp với nền đen của app
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
    },
    fabText: {
      color: '#FFF',
      fontSize: 35,
      fontWeight: '300',
      lineHeight: 40,
    },
  });