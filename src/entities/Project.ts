import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

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

}