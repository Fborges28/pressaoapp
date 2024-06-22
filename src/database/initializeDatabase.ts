import { type SQLiteDatabase } from "expo-sqlite";

export async function initializeDatabase(database: SQLiteDatabase) {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      pressure_id INTEGER,
      FOREIGN KEY (pressure_id)
      REFERENCES pressure_measurement (id) 
        ON UPDATE CASCADE
        ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pressure_measurement (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      time TEXT NOT NULL,
      systolic_pressure REAL,
      diastolic_pressure REAL,
      schedule_id INTEGER NOT NULL,
      FOREIGN KEY (schedule_id)
      REFERENCES schedule (id) 
        ON UPDATE RESTRICT
        ON DELETE RESTRICT
    )
  `);
}
