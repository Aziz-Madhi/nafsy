import { Moon, Sun } from 'lucide-react-native';
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
          <Moon size={24} className="text-foreground" />
        ) : (
          <Sun size={24} className="text-foreground" />
        )}
      </View>
    </View>
  );
}