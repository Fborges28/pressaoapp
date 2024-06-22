import { useState, useEffect } from "react"
import { View, Text } from "react-native"
import { Stack, useLocalSearchParams } from "expo-router"

import { useScheduleDatabase } from "@/hooks/useScheduleDatabase"

export default function Details() {
  const [data, setData] = useState({
    date: ""
  })

  const scheduleDatabase = useScheduleDatabase()
  const params = useLocalSearchParams<{ id: string }>()

  useEffect(() => {
    if (params.id) {
      scheduleDatabase.show(Number(params.id)).then((response) => {
        if (response) {
          setData({
            date: new Date(response.date).toLocaleDateString("pt-br")
          })
        }
      })
    }
  }, [params.id])

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Stack.Screen
        options={{
          title: 'Detalhe: ' + params.id,
          headerStyle: { backgroundColor: '#f4511e' },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          }        }}
      />
      <Text style={{ fontSize: 32 }}>ID: {params.id} </Text>

      <Text style={{ fontSize: 32 }}>Data: {data.date}</Text>

    </View>
  )
}
