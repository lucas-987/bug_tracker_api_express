import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        unique: true
    })
    username: string

    @Column({
        unique: true
    })
    email: string

    @Column({
        length: 60 // length of a hashed password
    })
    passwordHash: string
}