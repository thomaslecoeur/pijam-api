import { BaseContext } from 'koa';
import {
    getManager,
    Repository,
    Not,
    Equal,
    Like,
    SelectQueryBuilder
} from 'typeorm';
import { validate, ValidationError } from 'class-validator';
import {
    request,
    summary,
    path,
    body,
    responsesAll,
    tagsAll,
    query
} from 'koa-swagger-decorator';
import { Jam, jamSchema, Point } from '../entity/jam';
import { User } from '../entity/user';
import * as GeoJSON from 'geojson';
import * as qs from 'qs';

@responsesAll({
    200: { description: 'success' },
    400: { description: 'bad request' },
    401: { description: 'unauthorized, missing/wrong jwt token' }
})
@tagsAll(['Jam'])
export default class JamController {
    @request('get', '/jams')
    @summary('Find all jams')
    @query({
        'point[lng]': {
            type: 'number',
            required: false,
            description: 'Example: 6.3'
        },
        'point[lat]': {
            type: 'number',
            required: false,
            description: 'Example: 4'
        },
        'point[maxDistance]': {
            type: 'number',
            required: false,
            description: 'In meters. Example: 1000'
        }
    })
    public static async getJams(ctx: BaseContext) {
        // get a jam repository to perform operations with jam
        const jamRepository: Repository<Jam> = getManager().getRepository(Jam);

        const query = qs.parse(ctx.query);

        const jamQuery: SelectQueryBuilder<Jam> = jamRepository
            .createQueryBuilder('jam')
            .leftJoinAndSelect('jam.author', 'author')
            .leftJoinAndSelect('jam.attendants', 'attendants');

        if (
            query.point &&
            query.point.lng &&
            query.point.lat &&
            !isNaN(query.point.lng) &&
            !isNaN(query.point.lat)
        ) {
            const origin = {
                type: 'Point',
                coordinates: [query.point.lng, query.point.lat]
            };

            jamQuery
                .where(
                    'ST_DWithin(jam.coordinates, ST_SetSRID(ST_GeomFromGeoJSON(:origin), 4326), :maxDistance, true)'
                )
                .orderBy({
                    'ST_DWithin(jam.coordinates, ST_SetSRID(ST_GeomFromGeoJSON(:origin), 4326), :maxDistance, true)': {
                        order: 'ASC',
                        nulls: 'NULLS FIRST'
                    }
                })
                .setParameters({
                    origin: JSON.stringify(origin),
                    maxDistance: query.point.maxDistance || 5000
                });
        }

        const jams: Jam[] = await jamQuery.getMany();

        // return OK status code and loaded jams array
        ctx.status = 200;
        ctx.body = jams;
    }

    @request('get', '/jams/{id}')
    @summary('Find jam by id')
    @path({
        id: { type: 'number', required: true, description: 'id of jam' }
    })
    public static async getJam(ctx: BaseContext) {
        // get a jam repository to perform operations with jam
        const jamRepository: Repository<Jam> = getManager().getRepository(Jam);

        // load jam by id
        const jam: Jam = await jamRepository.findOne(+ctx.params.id || 0, {
            relations: ['author', 'attendants']
        });

        if (jam) {
            // return OK status code and loaded jam object
            ctx.status = 200;
            ctx.body = jam;
        } else {
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body =
                "The jam you are trying to retrieve doesn't exist in the db";
        }
    }

    @request('post', '/jams')
    @summary('Create a jam')
    @body(jamSchema)
    public static async createJam(ctx: BaseContext) {
        // get a jam repository to perform operations with jam
        const jamRepository: Repository<Jam> = getManager().getRepository(Jam);
        const userRepository: Repository<User> = getManager().getRepository(
            User
        );

        // build up entity jam to be saved
        const jamToBeSaved: Jam = new Jam();
        jamToBeSaved.author = await userRepository.findOne(
            ctx.request.body.author
        );

        jamToBeSaved.coordinates = new Point(ctx.request.body.coordinates);

        jamToBeSaved.attendants = [
            await userRepository.findOne(ctx.request.body.author)
        ];

        // validate jam entity
        const errors: ValidationError[] = await validate(jamToBeSaved); // errors is an array of validation errors

        if (errors.length > 0) {
            // return BAD REQUEST status code and errors array
            ctx.status = 400;
            ctx.body = errors;
        } else {
            // save the jam contained in the POST body
            const jam = await jamRepository.save(jamToBeSaved);
            // return CREATED status code and updated jam
            ctx.status = 201;
            ctx.body = jam;
        }
    }

    @request('put', '/jams/{id}')
    @summary('Update a jam')
    @path({
        id: { type: 'number', required: true, description: 'id of jam' }
    })
    @body(jamSchema)
    public static async updateJam(ctx: BaseContext) {
        // get a jam repository to perform operations with jam
        const jamRepository: Repository<Jam> = getManager().getRepository(Jam);

        // update the jam by specified id
        // build up entity jam to be updated
        const jamToBeUpdated: Jam = new Jam();
        jamToBeUpdated.id = +ctx.params.id || 0; // will always have a number, this will avoid errors

        // validate jam entity
        const errors: ValidationError[] = await validate(jamToBeUpdated); // errors is an array of validation errors

        if (errors.length > 0) {
            // return BAD REQUEST status code and errors array
            ctx.status = 400;
            ctx.body = errors;
        } else if (!(await jamRepository.findOne(jamToBeUpdated.id))) {
            // check if a jam with the specified id exists
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body =
                "The jam you are trying to update doesn't exist in the db";
        } else if (
            await jamRepository.findOne({
                id: Not(Equal(jamToBeUpdated.id))
            })
        ) {
            // return BAD REQUEST status code and email already exists error
            ctx.status = 400;
            ctx.body = 'The specified e-mail address already exists';
        } else {
            // save the jam contained in the PUT body
            const jam = await jamRepository.save(jamToBeUpdated);
            // return CREATED status code and updated jam
            ctx.status = 201;
            ctx.body = jam;
        }
    }

    @request('delete', '/jams/{id}')
    @summary('Delete jam by id')
    @path({
        id: { type: 'number', required: true, description: 'id of jam' }
    })
    public static async deleteJam(ctx: BaseContext) {
        // get a jam repository to perform operations with jam
        const jamRepository = getManager().getRepository(Jam);

        // find the jam by specified id
        const jamToRemove: Jam = await jamRepository.findOne(
            +ctx.params.id || 0,
            { relations: ['author'] }
        );

        if (!jamToRemove) {
            // return a BAD REQUEST status code and error message
            ctx.status = 400;
            ctx.body =
                "The jam you are trying to delete doesn't exist in the db";
        } else if (ctx.state.user.email !== jamToRemove.author.email) {
            // check jam's token id and jam id are the same
            // if not, return a FORBIDDEN status code and error message
            ctx.status = 403;
            ctx.body = 'A jam can only be deleted by its author';
        } else {
            // the jam is there so can be removed
            await jamRepository.remove(jamToRemove);
            // return a NO CONTENT status code
            ctx.status = 204;
        }
    }

    @request('delete', '/testjams')
    @summary('Delete jams generated by integration and load tests')
    public static async deleteTestJams(ctx: BaseContext) {
        // get a jam repository to perform operations with jam
        const jamRepository = getManager().getRepository(Jam);

        // find test jams
        const jamsToRemove: Jam[] = await jamRepository.find({
            where: { email: Like('%@citest.com') }
        });

        // the jam is there so can be removed
        await jamRepository.remove(jamsToRemove);

        // return a NO CONTENT status code
        ctx.status = 204;
    }
}
