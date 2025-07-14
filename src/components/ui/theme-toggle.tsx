import { Pressable } from 'react-native';
import { useColorScheme } from '~/lib/useColorScheme';
import { Sun, Moon } from 'lucide-react-native';
import { cn } from '~/lib/utils';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { colorScheme, toggleColorScheme } = useColorScheme();

  return (
    <Pressable
      onPress={toggleColorScheme}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background',
        className
      )}
    >
      {colorScheme === 'dark' ? (
        <Sun className="h-4 w-4 text-foreground" />
      ) : (
        <Moon className="h-4 w-4 text-foreground" />
      )}
    </Pressable>
  );
}