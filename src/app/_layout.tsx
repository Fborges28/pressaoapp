import { Stack, Slot } from "expo-router"
import { SQLiteProvider } from "expo-sqlite"

import { initializeDatabase } from "@/database/initializeDatabase"
import { MD3LightTheme, PaperProvider, useTheme } from 'react-native-paper';


const theme = {
  ...MD3LightTheme, // or MD3DarkTheme
  roundness: 2,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#4C7DFA',
    //secondary: '#f1c40f',
    //tertiary: '#a1b2c3',
  },
};

export type AppTheme = typeof theme;

export const useAppTheme = () => useTheme<AppTheme>();

export default function RootLayout() {
  return (
      <SQLiteProvider databaseName="database.db" onInit={initializeDatabase}>
        <PaperProvider theme={theme}>
          <Stack initialRouteName="index">
            <Stack.Screen
              name="index"
            />
          </Stack>
        </PaperProvider>
      </SQLiteProvider>
  );
}
