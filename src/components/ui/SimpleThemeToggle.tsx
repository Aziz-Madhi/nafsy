import { SymbolView } from 'expo-symbols';
import { View } from 'react-native';
import { useColorScheme } from 'react-native';

export function SimpleThemeToggle() {
  const systemColorScheme = useColorScheme();
  const currentScheme = systemColorScheme || 'light';

  // Display only - shows current system theme, no manual switching
  return (
    <View className="items-center justify-center">
      <View className="px-0.5">
        {currentScheme === 'dark' ? (
          <SymbolView name="moon.fill" size={24} tintColor="#1F2937" />
        ) : (
          <SymbolView name="sun.max.fill" size={24} tintColor="#1F2937" />
        )}
      </View>
    </View>
  );
}