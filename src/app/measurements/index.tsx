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
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

moment.locale('pt');

moment.updateLocale('pt', {
    months : months
});

type GroupedMonth = {
  [key: string]: ScheduleWithPressureMeasurements[]
}

function groupSchedulesByMonth(schedules: ScheduleWithPressureMeasurements[]): GroupedMonth {
  return schedules.reduce((acc, schedule) => {
    const monthName = moment.tz(schedule.date, "America/Sao_Paulo").format('MMMM');
    if (!acc[monthName]) {
      acc[monthName] = [];
    }

    acc[monthName].push(schedule);
    return acc;
  }, {} as GroupedMonth);
}

function translateSchedule(schedule: ScheduleWithPressureMeasurements) {
  const measurementsByDate: { [key: string]: PressureMeasurementDatabase[] } = {};

  schedule.pressure_measurements.forEach(pm => {
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

  return { id: schedule.id, content };
}

function createAccordionFromMonths(groupedSchedules: GroupedMonth): TAccordion[] {
  return months.map((month, index) => {
    const schedules = groupedSchedules[month] || [];
    const sortedSchedules = schedules.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const measurementsByDay = sortedSchedules.reduce((acc, schedule) => {
      const day = moment.tz(schedule.date, "America/Sao_Paulo").format("DD/MM/YYYY");
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(schedule);
      return acc;
    }, {} as { [key: string]: ScheduleWithPressureMeasurements[] });

    const items = Object.keys(measurementsByDay).map((day, dayIndex) => {
      const dayMeasurements = measurementsByDay[day];
      const localeDay = moment.tz(dayMeasurements[0].date, "America/Sao_Paulo").format("DD/MM/YYYY");
      const dayContent = dayMeasurements.map(translateSchedule);
      return {
        id: `${index + 1}.${dayIndex + 1}`,
        title: '',
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
  const { colors: { primary } } = useAppTheme();
  const [schedules, setSchedules] = useState<ScheduleWithPressureMeasurements[]>([]);
  const [dates, setDates] = useState<TAccordion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pressureDatabase = usePressureDatabase();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await pressureDatabase.all();
        setSchedules(response);

        const groupedSchedules = groupSchedulesByMonth(response);
        const accordionData = createAccordionFromMonths(groupedSchedules);
        setDates(accordionData);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching schedules:", error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <SafeAreaView>
      <ScrollView>
        <Stack.Screen
          options={{
            title: 'Histórico - Pressão / Medições',
            headerStyle: { backgroundColor: primary },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        />
        {
          isLoading ? (
            <View style={styles.loadingContainer}>
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
    gap: 16,
  },
  loadingContainer: {
    height: height - 40,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
