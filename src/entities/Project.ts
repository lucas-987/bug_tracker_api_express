import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Bug } from "./Bug";

@Entity() 
export class Project {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column({
        type: "text",
        nullable: true
    })
    description: string

    @OneToMany(() => Bug, (bug) => bug.project)
    bugs: Bug[]
}