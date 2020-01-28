import { IsEmail, Length } from 'class-validator';
import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    ManyToMany,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
    BeforeInsert,
    Index
} from 'typeorm';
import { Jam } from './jam';

export enum Instruments {
    guitar = 'GUITAR',
    bass = 'BASS',
    keyboard = 'KEYBOARD',
    voice = 'VOICE',
    drums = 'DRUMS',
    ukulele = 'UKULELE',
    violin = 'VIOLIN',
    otherWind = 'OTHER WIND',
    otherStrings = 'OTHER STRING',
    otherPercussion = 'OTHER PERCUSSION'
}

interface IAvailabilityMeta {
    desc?: string;
    instruments?: Instruments[];
    expiresOn?: Date;
}

export class AvailabilityMeta {
    desc?: string;
    instruments?: Instruments[];
    expiresOn?: Date;

    constructor(obj?: IAvailabilityMeta) {
        this.desc = obj.desc;
        this.instruments = obj.instruments;
        this.expiresOn = obj.expiresOn;
    }
}

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Index({ unique: true })
    @Column({
        nullable: true
    })
    auth0Id?: string;

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

    @Column({
        default: false
    })
    availability: Boolean;

    @Column('json', {
        nullable: true
    })
    availabilityMeta?: AvailabilityMeta;

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

    @Column({ default: false })
    superAdmin: Boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedDate: Date;
}

export const userSchemaMinimal = {
    auth0Id: { type: 'string', required: true },
    nickname: { type: 'string', required: true, example: 'Thomas' },
    email: {
        type: 'string',
        required: true,
        example: 'coucou@thomaslecoeur.com'
    }
};

export const userSchema = {
    id: { type: 'number', required: true, example: 1 },
    ...userSchemaMinimal,
    superAdmin: { type: 'boolean' },
    jams: {
        type: 'array',
        required: false,
        items: { type: 'number', example: 1 }
    }
};

export const availabilitySchema = {
    availability: { type: 'boolean', required: false },
    desc: {
        type: 'string',
        required: false,
        example: 'Wants to jam at my place'
    },
    instruments: {
        type: 'array',
        required: false,
        items: {
            type: 'string',
            example: 'GUITAR'
        }
    }
};
