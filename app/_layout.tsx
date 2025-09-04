import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from "expo-router";
import { PortalHost } from '@rn-primitives/portal';
import "C:/Projects/mini project 7/my-app/global.css"
import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return(
    <>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false, // hides header for all screens
        }}
       />
      {/* Children of <Portal /> will render here */}
      <PortalHost />
      </ThemeProvider>
    </>
  );
}
