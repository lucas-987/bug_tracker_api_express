import "reflect-metadata"
import { DataSource } from "typeorm"
import { Project } from "./entities/Project"

export const AppDataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "bug_tracker",
    password: "bug_tracker_password",
    database: "bug_tracker_express",
    synchronize: true,
    logging: true,
    entities: [Project],
    subscribers: [],
    migrations: [],
})