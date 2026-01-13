import { env } from "@test-app/env/server";
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

function getDb() {
	if (!_db) {
		const pool = new Pool({
			connectionString: env.DB.connectionString,
      /*
      Without this maxUses, the app crashes with "Error: The Workers runtime canceled this request because it detected that your Worker's code had hung and would never generate a response."
      */
			maxUses: 1
		})
		_db = drizzle({ client: pool, schema })
	}
	return _db
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
	get(_, prop) {
		const instance = getDb()
		const value = instance[prop as keyof typeof instance]
		return typeof value === "function" ? value.bind(instance) : value
	}
})

export type DB = ReturnType<typeof getDb>
export { schema }
