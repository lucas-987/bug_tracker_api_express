import "reflect-metadata"
import { DataSource } from "typeorm"
import { Bug } from "./entities/Bug"
import { Project } from "./entities/Project"
import { User } from "./entities/User"

export const AppDataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "bug_tracker",
    password: "bug_tracker_password",
    database: "bug_tracker_express",
    synchronize: true,
    logging: true,
    entities: [Project, Bug, User],
    subscribers: [],
    migrations: [],
})

export const userRepository = AppDataSource.getRepository(User);