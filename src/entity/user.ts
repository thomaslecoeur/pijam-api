import { IsEmail, Length } from 'class-validator';
import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    ManyToMany,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn
} from 'typeorm';
import { Jam } from './jam';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        length: 80
    })
    @Length(2, 80)
    nickname: string;

    @Column({
        length: 100
    })
    @Length(10, 100)
    @IsEmail()
    email: string;

    @OneToMany(
        type => Jam,
        jam => jam.author,
        { cascade: true }
    )
    jams: Jam[];

    @ManyToMany(
        type => Jam,
        jam => jam.attendants,
        { cascade: true }
    )
    attendedJams: Jam[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedDate: Date;
}

export const userSchema = {
    id: { type: 'number', required: true, example: 1 },
    nickname: { type: 'string', required: true, example: 'Javier' },
    email: {
        type: 'string',
        required: true,
        example: 'avileslopez.javier@gmail.com'
    },
    jams: {
        type: 'array',
        required: false,
        items: { type: 'number', example: 1 }
    }
};
