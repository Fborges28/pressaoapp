import { useSQLiteContext } from "expo-sqlite";
import { ScheduleDatabase } from "./useScheduleDatabase";
import { isFilledObject, logJSON } from "@/helpers";

export type PressureMeasurementDatabase = {
  id: number;
  time: string;
  systolic_pressure: number;
  diastolic_pressure: number;
  schedule_id: number;
};

export type ScheduleWithPressureMeasurements = {
  id: number;
  date: string;
  pressure_measurements: PressureMeasurementDatabase[];
};

export function usePressureDatabase() {
  const database = useSQLiteContext();

  async function create(
    scheduleData: Omit<ScheduleDatabase, "id" | "pressure_id">,
    pressureData: Omit<PressureMeasurementDatabase, "id" | "schedule_id">
  ) {
    try {
      await database.execAsync("BEGIN TRANSACTION");

      // Check if a schedule already exists for the date
      const querySchedule = "SELECT * FROM schedule WHERE date LIKE ?";

      const queryScheduleAll = "SELECT * FROM schedule";

      const allSchedules = await database.getAllAsync<ScheduleDatabase>(
        queryScheduleAll
      );

      const currentDate = scheduleData.date.split("T")[0];
      const hasSchedule = await database.getAllAsync<ScheduleDatabase>(
        querySchedule,
        `%${currentDate}%`
      );

      console.log("🚀 ~ usePressureDatabase ~ allSchedules:", allSchedules);
      console.log("🚀 ~ usePressureDatabase ~ hasSchedule:", hasSchedule);
      console.log("🚀 ~ usePressureDatabase ~ currentDate:", currentDate);

      let scheduleId;

      if (hasSchedule.length === 0) {
        // Schedule does not exist, create a new one
        const scheduleStatement = await database.prepareAsync(
          "INSERT INTO schedule (date, pressure_id) VALUES ($date, NULL)"
        );

        const scheduleResult = await scheduleStatement.executeAsync({
          $date: scheduleData.date,
        });

        await scheduleStatement.finalizeAsync();
        scheduleId = scheduleResult.lastInsertRowId;
      } else {
        // Schedule exists, reuse the schedule_id
        scheduleId = hasSchedule[0].id;
      }

      // Insert pressure measurement
      const pressureStatement = await database.prepareAsync(
        "INSERT INTO pressure_measurement (time, systolic_pressure, diastolic_pressure, schedule_id) VALUES ($time, $systolic_pressure, $diastolic_pressure, $schedule_id)"
      );

      const pressureResult = await pressureStatement.executeAsync({
        $time: pressureData.time,
        $systolic_pressure: pressureData.systolic_pressure,
        $diastolic_pressure: pressureData.diastolic_pressure,
        $schedule_id: scheduleId,
      });
      await pressureStatement.finalizeAsync();

      const pressureId = pressureResult.lastInsertRowId;

      // Update schedule with the pressure_id if it was a new schedule
      if (hasSchedule.length === 0) {
        const updateScheduleStatement = await database.prepareAsync(
          "UPDATE schedule SET pressure_id = $pressure_id WHERE id = $id"
        );
        await updateScheduleStatement.executeAsync({
          $pressure_id: pressureId,
          $id: scheduleId,
        });
        await updateScheduleStatement.finalizeAsync();
      }

      await database.execAsync("COMMIT");

      return { scheduleId, pressureId };
    } catch (error) {
      await database.execAsync("ROLLBACK");
      throw error;
    }
  }

  async function searchByName(date: string) {
    try {
      const query = "SELECT * FROM pressure_measurement WHERE date LIKE ?";

      const response = await database.getAllAsync<PressureMeasurementDatabase>(
        query,
        `%${date}%`
      );

      return response;
    } catch (error) {
      throw error;
    }
  }

  async function update(data: PressureMeasurementDatabase) {
    const statement = await database.prepareAsync(
      "UPDATE pressure_measurement SET time = $time, systolic_pressure = $systolic_pressure, diastolic_pressure = $diastolic_pressure WHERE id = $id"
    );

    try {
      await statement.executeAsync({
        $id: data.id,
        $time: data.time,
        $systolic_pressure: data.systolic_pressure,
        $diastolic_pressure: data.diastolic_pressure,
      });
    } catch (error) {
      throw error;
    } finally {
      await statement.finalizeAsync();
    }
  }

  async function remove(id: number) {
    try {
      await database.execAsync(
        "DELETE FROM pressure_measurement WHERE id = " + id
      );
    } catch (error) {
      throw error;
    }
  }

  async function show(id: number) {
    try {
      const query = "SELECT * FROM pressure_measurement WHERE id = ?";

      const response =
        await database.getFirstAsync<PressureMeasurementDatabase>(query, [id]);

      return response;
    } catch (error) {
      throw error;
    }
  }

  async function all(): Promise<ScheduleWithPressureMeasurements[]> {
    try {
      const query = `
        SELECT 
          s.id as schedule_id, s.date, 
          pm.id as pressure_id, pm.time, pm.systolic_pressure, pm.diastolic_pressure, pm.schedule_id
        FROM schedule s
        LEFT JOIN pressure_measurement pm ON s.id = pm.schedule_id
        ORDER BY
          date(pm.time) ASC
      `;

      const rows = await database.getAllAsync<any>(query);

      const schedulesMap: { [key: number]: ScheduleWithPressureMeasurements } =
        {};

      rows.forEach((row) => {
        const scheduleId = row.schedule_id;

        if (!schedulesMap[scheduleId]) {
          schedulesMap[scheduleId] = {
            id: row.schedule_id,
            date: row.date,
            pressure_measurements: [],
          };
        }

        if (row.pressure_id !== null) {
          schedulesMap[scheduleId].pressure_measurements.push({
            id: row.pressure_id,
            time: row.time,
            systolic_pressure: row.systolic_pressure,
            diastolic_pressure: row.diastolic_pressure,
            schedule_id: row.schedule_id,
          });
        }
      });

      return Object.values(schedulesMap);
    } catch (error) {
      throw error;
    }
  }

  async function dropTable() {
    try {
      const query = "DROP TABLE pressure_measurement";

      const response = await database.execAsync(query);

      return response;
    } catch (error) {
      throw error;
    }
  }

  return {
    all,
    dropTable,
    create,
    searchByName,
    update,
    remove,
    show,
  };
}
