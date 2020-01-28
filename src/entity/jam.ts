import {
    Entity,
    ManyToMany,
    PrimaryGeneratedColumn,
    ManyToOne,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    JoinTable,
    Index
} from 'typeorm';

import { User } from './user';
import { IsDefined } from 'class-validator';
import * as validator from 'class-validator';
import { Point as GeoJSONPoint, Position, BBox, Geometry } from 'geojson';

export class Point implements GeoJSONPoint {
    type: 'Point';
    coordinates: Position;
    bbox?: BBox;

    constructor(coordinates: number[]) {
        this.type = 'Point';
        this.coordinates = coordinates;
    }
}

@Entity()
export class Jam {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(
        type => User,
        user => user.jams,
        {
            onDelete: 'CASCADE'
        }
    )
    author?: User;

    @Column('geometry', {
        nullable: true, // TODO: Set nullable to false
        spatialFeatureType: 'Point',
        srid: 4326
    })
    @Index({
        spatial: true
    })
    @IsDefined()
    coordinates!: Geometry;

    @ManyToMany(
        type => User,
        user => user.attendedJams,
        {
            onDelete: 'CASCADE'
        }
    )
    @JoinTable()
    attendants: User[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedDate: Date;
}

export const jamSchema = {
    id: { type: 'number', required: false, example: 1 },
    author: { type: 'number', required: true, example: 1 },
    coordinates: {
        type: 'array',
        required: true,
        items: { type: 'number' },
        example: [6.3, 4]
    },
    attendants: {
        type: 'array',
        required: false,
        items: { type: 'number', example: 1 }
    }
};
