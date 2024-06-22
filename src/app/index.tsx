import { View, StyleSheet } from "react-native";
import { Text, Button } from 'react-native-paper';
import { Stack, router } from "expo-router"
import { useAppTheme } from "./_layout";

function Measurements() {
  const {
    colors: { primary },
  } = useAppTheme();

  return (
    <View style={styles.container}>
      <Stack.Screen
          options={{
            title: 'Histórico - Pressão',
            headerStyle: { backgroundColor: primary },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            }
          }}
      />
      <Text variant="titleMedium" style={{marginBottom: 8, textAlign: "center"}}>Selecione uma das opções abaixo:</Text>
      <Button mode="contained" onPress={() => router.navigate("/new-measurement")}>
        Nova medição
      </Button>
      <Button mode="contained" onPress={() => router.navigate("/measurements")}>
        Ver medições
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 32, 
    gap: 16
  }
});

export default Measurements;
