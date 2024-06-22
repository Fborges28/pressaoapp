import Accordion, { TAccordion } from "@/components/Accordion";
import { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Dimensions } from "react-native";
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "../_layout";
import { Stack } from "expo-router";
import { PressureMeasurementDatabase, ScheduleWithPressureMeasurements, usePressureDatabase } from "@/hooks/usePressureDatabase";
import moment from 'moment';
import 'moment-timezone';
import { logJSON } from "@/helpers";

const months = [
  "Janeiro", 
  "Fevereiro", 
  "Março", 
  "Abril", 
  "Maio", 
  "Junho", 
  "Julho", 
  "Agosto", 
  "Setembro", 
  "Outubro", 
  "Novembro", 
  "Dezembro"
];

type GroupedMonth = {
  [key: string]: ScheduleWithPressureMeasurements[]
}

function groupSchedulesByMonth(schedules: ScheduleWithPressureMeasurements[]) {
  return schedules.reduce((acc, schedule) => {
    const monthIndex = moment.tz(schedule.date, "America/Sao_Paulo").month();
    const monthName = months[monthIndex];
    if (!acc[monthName]) {
      acc[monthName] = [];
    }
    acc[monthName].push(schedule);
    return acc;
  }, {} as { [key: string]: ScheduleWithPressureMeasurements[] });
}

function translateSchedule(schedule: ScheduleWithPressureMeasurements) {
  const { id, pressure_measurements } = schedule;
  const measurementsByDate: { [key: string]: PressureMeasurementDatabase[] } = {};

  // Group measurements by day
  pressure_measurements.forEach(pm => {
    const localeDate = moment.tz(pm.time, "America/Sao_Paulo").format("DD/MM/YYYY");
    if (!measurementsByDate[localeDate]) {
      measurementsByDate[localeDate] = [];
    }
    measurementsByDate[localeDate].push(pm);
  });

  let content = '';
  for (const [date, measurements] of Object.entries(measurementsByDate)) {
    content += measurements.map(pm => {
      const time = moment.tz(pm.time, "America/Sao_Paulo").format("HH:mm:ss");
      return `Horário: ${time}, Pressão: ${pm.systolic_pressure}/${pm.diastolic_pressure} mmHg`;
    }).join('\n') + '\n';
  }

  return { id, content };
}

function createAccordionFromMonths(groupedSchedules: GroupedMonth): TAccordion[] {
  return months.map((month, index) => {
    const schedules = groupedSchedules[month] || [];
    const sortedSchedules = schedules.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    // Group schedules by day within each month
    const schedulesByDay = sortedSchedules.reduce((acc, schedule) => {
      const day = moment.tz(schedule.date, "America/Sao_Paulo").format("DD/MM/YYYY");
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(schedule);
      return acc;
    }, {} as { [key: string]: ScheduleWithPressureMeasurements[] });


    const items = Object.keys(schedulesByDay).map((day: string, dayIndex: number) => {
      const daySchedules = schedulesByDay[day];
      const localeDay = moment.tz(daySchedules[0].date, "America/Sao_Paulo").format("DD/MM/YYYY");
      const sortedDaySchedules = daySchedules.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const dayContent = sortedDaySchedules.map(translateSchedule);
      return {
        id: `${index + 1}.${dayIndex + 1}`,
        title: ``,
        content: `\nDia: ${localeDay}\n` + dayContent.map(item => item.content).join('')
      };
    });

    return {
      id: index + 1,
      title: month,
      items
    };
  });
}

const { height } = Dimensions.get('window');

export default function Measurements() {
  const {
    colors: { primary },
  } = useAppTheme();

  const [schedules, setSchedules] = useState<ScheduleWithPressureMeasurements[]>([]);
  const [dates, setDates] = useState<TAccordion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const pressureDatabase = usePressureDatabase();

  async function list() {
    try {
      const response = await pressureDatabase.all();
      setSchedules(response);
      
      const groupedSchedules = groupSchedulesByMonth(response);
      const accordionData = createAccordionFromMonths(groupedSchedules);
      setDates(accordionData);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    list();
  }, []);

  useEffect(() => {
    if (dates.length > 0) {
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  }, [dates]);

  return (
    <SafeAreaView>
      <ScrollView>
        <Stack.Screen
          options={{
            title: 'Histórico - Pressão / Medições',
            headerStyle: { backgroundColor: primary },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />

        {
          isLoading ? (
            <View style={{ height: height - 40, flex: 1, justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator animating={true} size="large" />
            </View>
          ) : (
            <View style={styles.container}>
              <Text variant="titleLarge">Medições mensais</Text>
              <Accordion list={dates} />
            </View>
          )
        }
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 32,
    gap: 16
  }
});
