import { createPool } from "mysql2/promise";

//importar variables de entorno
import { DB_HOST, DB_NAME, DB_PASSWORD, DB_USER, DB_PORT } from "../config.js";

const conecctionSettings = {
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT
}


export const pool = createPool(conecctionSettings);

const createQuery = async () => {
    const result = await pool.query("SELECT 1 + 1 AS result")
    console.log(result[0]);
}
