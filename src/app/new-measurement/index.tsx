import { useState } from "react"
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, TextInput, Button, Dialog, Portal } from 'react-native-paper';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from "../_layout";

import moment, { Moment } from 'moment';
import { Stack, router } from "expo-router"
import 'moment-timezone';

import {
  useScheduleDatabase
} from "@/hooks/useScheduleDatabase"
import { usePressureDatabase } from "@/hooks/usePressureDatabase";

export default function Index() {
  const [id, setId] = useState("")
  const [date, setDate] = useState<Moment>(moment.tz("America/Sao_Paulo"));
  const [time, setTime] = useState<Moment>(moment.tz("America/Sao_Paulo"));
  const [systolic, setSystolic] = useState(0);
  const [diastolic, setDiastolic] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);


  const scheduleDatabase = useScheduleDatabase();
  const pressureDatabase = usePressureDatabase();

  const {
    colors: { primary },
  } = useAppTheme();

  async function create() {
    try {
      // new Date(year, monthIndex, day, hours, minutes, seconds)
      const dateToSave = moment.tz(date, "America/Sao_Paulo").format("YYYY-MM-DD");
      const timeToSave = moment.tz(time, "America/Sao_Paulo").format("HH:mm:ss");
      const mergedDateTimeString = `${dateToSave} ${timeToSave}`;
      const mergedDateTime = moment.tz(mergedDateTimeString, 'YYYY-MM-DD HH:mm:ss', "America/Sao_Paulo");
      
      // Convert to ISO string
      const isoString = mergedDateTime.toISOString();
      const scheduleData = {
        date: isoString,
      };
      
      
      const pressureData = {
        time: isoString,
        systolic_pressure: systolic,
        diastolic_pressure: diastolic,
      };

      const { scheduleId, pressureId } = await pressureDatabase.create(scheduleData, pressureData);

      console.log("Created schedule with ID:", scheduleId);
      console.log("Created pressure measurement with ID:", pressureId);

      setShowConfirmModal(true);
    } catch (error) {
      console.error("Error creating schedule and pressure measurement:", error);
    }
  }

  function goToHome(){
    setShowConfirmModal(false);
    router.navigate("/")
  }

  async function handleSave() {
    create()
    setId("")
    setDate(moment.tz("America/Sao_Paulo"))
  }

  const onChangeDay = (event: any, selectedDate:any) => {
    const currentDate = selectedDate;
    setDate(currentDate);
  };

  const onChangeTime = (event: any, selectedDate:any) => {
    const currentDate = selectedDate;
    setTime(currentDate);
  };

  const openDatePicker = (mode: "date" | "time", value: Date, onChange: (event: any, selectedDate: any) => void) => {
    DateTimePickerAndroid.open({
      value,
      onChange,
      mode,
      is24Hour: true,
    });
  };

  const showDatepicker = () => {
    openDatePicker("date", moment.tz(date, "America/Sao_Paulo").toDate(), onChangeDay);
  };

  const showTimepicker = () => {
    openDatePicker("time", moment.tz(time, "America/Sao_Paulo").toDate(), onChangeTime);
  };

  const handleDrop = async () => {
    await scheduleDatabase.dropTable();
    await pressureDatabase.dropTable();
  }

  return (
    <SafeAreaView>
      <ScrollView>
        <Stack.Screen
          options={{
            title: 'Histórico - Pressão / Nova medição',
            headerStyle: { backgroundColor: primary },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            }
          }}
        />

        <Portal>
          <Dialog visible={showConfirmModal} onDismiss={() => goToHome()}>
            <Dialog.Title>Dados salvos</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium">Resumo:</Text>
              <Text variant="bodySmall">Dia: {moment(date).format('DD-MM-YYYY')}, Horário: {moment(time).format('HH:mm:ss')}</Text>
              <Text variant="bodySmall">Pressão: {systolic}/{diastolic} mmHg</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => goToHome()}>Ok</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* <Button mode="contained" onPress={handleDrop}>Deletar Banco</Button> */}

        <View style={styles.container}>
          <View style={styles.infoContainer}>
            <Text variant="bodyLarge">Preencha abaixo os valores referentes à sua medição de pressão arterial.</Text>
            <Text variant="bodyLarge">Todos os campos devem ser preenchidos para que seja possível salvar a medição.</Text>
          </View>

          <View>
            <Text variant="bodyLarge">Pressão:</Text>
            <View style={styles.pressureContainer}>
              <TextInput
                keyboardType="number-pad"
                label="Sistolica"
                value={systolic.toString()}
                onChangeText={text => setSystolic(Number(text))}
                style={{width: 90}}
              />

              <Text variant="bodyLarge">/</Text>

              <TextInput
                keyboardType="number-pad"
                label="Diastolica"
                value={diastolic.toString()}
                onChangeText={text => setDiastolic(Number(text))}
                style={{width: 100}}
              />
            </View>
          </View>

          <View style={styles.dayContainer}>
            <Text variant="bodyLarge">Defina o dia e horário:</Text>
            <Button style={{borderColor: primary}} mode="outlined" onPress={showDatepicker}>Dia: {moment(date).format('DD-MM-YYYY')}</Button>
            <Button style={{borderColor: primary}} mode="outlined" onPress={showTimepicker}>Horário: {moment(time).format('HH:mm:ss')}</Button>
            <Button mode="outlined" disabled={systolic === 0 || diastolic === 0} onPress={handleSave}>Salvar</Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 32, 
    gap: 16
  },
  infoContainer: {
    flex: 1,
    gap: 16,
    marginBottom: 32
  },
  dayContainer: {
    display: "flex",
    gap: 16
  },
  pressureContainer: {
    display: "flex",
    flexDirection: "row",
    gap: 16,
    paddingTop: 16,
    alignItems: "center",
    flex: 1
  }
});

