import { SwaggerRouter } from 'koa-swagger-decorator';
import controller = require('./controller');

const protectedRouter = new SwaggerRouter();

// USER ROUTES
protectedRouter.get('/users', controller.user.getUsers);
protectedRouter.get('/users/:id', controller.user.getUser);
protectedRouter.post('/users', controller.user.createUser);
protectedRouter.put('/users/:id', controller.user.updateUser);
protectedRouter.put(
    '/me/availability',
    controller.user.updateCurrentUserAvailability
);
protectedRouter.delete('/users/:id', controller.user.deleteUser);
protectedRouter.delete('/testusers', controller.user.deleteTestUsers);

// JAM ROUTES
protectedRouter.get('/jams', controller.jam.getJams);
protectedRouter.get('/jams/:id', controller.jam.getJam);
protectedRouter.post('/jams', controller.jam.createJam);
protectedRouter.put('/jams/:id', controller.jam.updateJam);
protectedRouter.put('/jams/:id/join', controller.jam.joinJam);
protectedRouter.delete('/jams/:id', controller.jam.deleteJam);
protectedRouter.delete('/testjams', controller.jam.deleteTestJams);

// Swagger endpoint
protectedRouter.swagger({
    title: 'node-typescript-koa-rest',
    description:
        'API REST using NodeJS and KOA framework, typescript. TypeORM for SQL with class-validators. Middlewares JWT, CORS, Winston Logger.',
    version: '1.5.0'
});

// mapDir will scan the input dir, and automatically call router.map to all Router Class
protectedRouter.mapDir(__dirname);

export { protectedRouter };
