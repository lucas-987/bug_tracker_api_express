import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Project } from "./Project";

export type BugStatus = "open" | "close";
export const bugStatusValues: string[] = ["open", "close"];

@Entity()
export class Bug {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column({
        type: "text",
        nullable: true
    })
    description: string

    @Column({
        default: 1
    })
    priority: number

    @Column({
        type: "enum",
        enum: bugStatusValues,
        default: "open"
    })
    status: BugStatus

    @CreateDateColumn()
    start_date: Date

    @Column({
        type: "date",
        nullable: true
    })
    end_date: Date | null

    @Column({
        type: "date",
        nullable: true
    })
    due_date: Date | null

    @ManyToOne(() => Project, (project) => project.bugs, {
        onDelete: "CASCADE"
    })
    project: Project
}