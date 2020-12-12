/* eslint-disable no-undef */
const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');
const { makeAuthHeader } = require('./test-helpers');

describe('Protected Endpoints', function() {
  let db;

  const {
    testUsers,
    testThings,
    testReviews,
  } = helpers.makeThingsFixtures();

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('cleanup', () => helpers.cleanTables(db));

  afterEach('cleanup', () => helpers.cleanTables(db));

  const protectedEndpoints = [
    {
      name: 'GET /api/things/:thing_id',
      path: '/api/things/1'
    },
    {
      name: 'GET /api/things/:thing_id/reviews',
      path: '/api/things/1/reviews'
    }
  ];

  protectedEndpoints.forEach(endpoint => {
    describe(`Protected endpoint ${endpoint.name}`, () => {
      beforeEach('insert things', () =>
        helpers.seedThingsTables(
          db,
          testUsers,
          testThings
        )
      );
      
      describe(endpoint.name, () => {
        it('responds with 401 \'Missing bearer token\' when no bearer token', () => {
          return supertest(app)
            .get(endpoint.path)
            .expect(401, { error: 'Missing bearer token' });
        });
      });
  
      it('responds 401 \'Unauthorized request\' when invalid JWT', () => {
        const validUser = testUsers[0];
        const badSecret = 'not-a-secret';
        return supertest(app)
          .get(endpoint.path)
          .set('Authorization', makeAuthHeader(validUser, badSecret))
          .expect(401, { error: 'Unauthorized request' });
      });
  
      it('responds 401 \'Unauthorized request\' when invalid user', () => {
        const userInvalidCreds = { user_name: 'user-not', password: 'existy' };
        return supertest(app)
          .get(endpoint.path)
          .set('Authorization', makeAuthHeader(userInvalidCreds))
          .expect(401, { error: 'Unauthorized request' });
      });
    });
  });
});
