import { useSQLiteContext } from "expo-sqlite";

export type ScheduleDatabase = {
  id: number;
  date: string;
  pressure_id: number;
};
export function useScheduleDatabase() {
  const database = useSQLiteContext();

  async function create(data: Omit<ScheduleDatabase, "id">) {
    const statement = await database.prepareAsync(
      "INSERT INTO schedule (date, pressure_id) VALUES ($date, $pressure_id)"
    );

    try {
      const result = await statement.executeAsync({
        $date: data.date,
        $pressure_id: data.pressure_id,
      });

      const insertedRowId = result.lastInsertRowId.toLocaleString();

      return { insertedRowId };
    } catch (error) {
      throw error;
    } finally {
      await statement.finalizeAsync();
    }
  }

  async function searchByName(date: string) {
    try {
      const query = "SELECT * FROM schedule WHERE date LIKE ?";

      const response = await database.getAllAsync<ScheduleDatabase>(
        query,
        `%${date}%`
      );

      return response;
    } catch (error) {
      throw error;
    }
  }

  async function update(data: ScheduleDatabase) {
    const statement = await database.prepareAsync(
      "UPDATE schedule SET date = $date, pressure_id = $pressure_id WHERE id = $id"
    );

    try {
      await statement.executeAsync({
        $id: data.id,
        $date: data.date,
        $pressure_id: data.pressure_id,
      });
    } catch (error) {
      throw error;
    } finally {
      await statement.finalizeAsync();
    }
  }

  async function remove(id: number) {
    try {
      await database.execAsync("DELETE FROM schedule WHERE id = " + id);
    } catch (error) {
      throw error;
    }
  }

  async function show(id: number) {
    try {
      const query = "SELECT * FROM schedule WHERE id = ?";

      const response = await database.getFirstAsync<ScheduleDatabase>(query, [
        id,
      ]);

      return response;
    } catch (error) {
      throw error;
    }
  }

  async function all() {
    try {
      const query = "SELECT * FROM schedule";

      const response = await database.getAllAsync<ScheduleDatabase>(query);

      return response;
    } catch (error) {
      throw error;
    }
  }

  async function dropTable() {
    try {
      const query = "DROP TABLE schedule";

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
