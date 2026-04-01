// tests/api/users.api.test.js
// Pure REST API tests using Playwright's APIRequestContext
// Covers: POST, GET all, GET by ID, DELETE, validation, error cases

import { test, expect } from '@playwright/test';
import {faker} from '@faker-js/faker';
import { UserSchema, UsersArraySchema, ErrorSchema } from '../../helpers/schemaHelper.js';
import {
  createUserApi,
  getUsersApi,
  getUserByIdApi,
  deleteUserApi,
  createUserAndGetBody,
  createUserGetBody,
} from '../../helpers/apiHelper.js';
//import { deleteUserByNameFromDB } from '../../helpers/dbHelper.js';


test.describe('API - POST /api/users (Create User)', () => {

  test('should create a user and return 201 with id, name, job', async ({ request }) => {
    const name=faker.person.fullName();
    const job=faker.person.jobTitle();
    const start = Date.now();
    const { response, body } = await createUserAndGetBody(request, name, job);
    const end   = Date.now();
    console.log('Created user:', body);
    console.log(response);
    // ── 1. Status & Headers ──────────────────────────
    expect(response.status()).toBe(201);
    expect(response.headers()['content-type']).toContain('application/json');

    // ── 2. Schema ────────────────────────────────────
    const result = UserSchema.safeParse(body);
    console.log('Schema validation result:', result);
    if (!result.success) {
      console.error('Schema validation failed:', result.error);
    }
    expect(result.success).toBe(true);
   
    // ── 3. Value correctness ─────────────────────────
    expect(body.id).toBeGreaterThan(0);
    expect(body.name).toBe(name);
    expect(body.job).toBe(job);
    expect(body.name).toBe(body.name.trim());
    expect(body.job).toBe(body.job.trim());
    
    // ── 5. No sensitive data ──────────────────────────
    expect(body).not.toHaveProperty('password');
    expect(body).not.toHaveProperty('token');
    
    // -- 6. Response time (optional) ─────────────────────────
    const duration = end - start;
    console.log(`Response time: ${duration}ms`);
    expect(duration).toBeLessThan(1000); // Example threshold
  });


  test('should return unique IDs for two different users', async ({ request }) => {
    const { body: user1 } = await createUserAndGetBody(request, 'UniqueUser1', 'Dev');
    const { body: user2 } = await createUserAndGetBody(request, 'UniqueUser2', 'QA');

    expect(user1.id).not.toBe(user2.id);

    await deleteUserByNameFromDB('UniqueUser1');
    await deleteUserByNameFromDB('UniqueUser2');
  });

  test('should return 500 when name is missing', async ({ request }) => {
    const response = await createUserApi(request, undefined, 'Engineer');
    // DB constraint: name is required - expect server error
    expect([400, 500]).toContain(response.status());
  });

  test('should return JSON content-type header', async ({ request }) => {
    const { response } = await createUserAndGetBody(request, 'HeaderCheck', 'Tester');
    expect(response.headers()['content-type']).toContain('application/json');
    await deleteUserByNameFromDB('HeaderCheck');
  });
});


test.describe('API - GET /api/users (List Users)', () => {

  test('GET /api/users/:id should return correct user', async ({ request }) => {
    const name=faker.person.fullName();
    const job=faker.person.jobTitle();
    const body = await createUserGetBody(request, name, job);
    const start = Date.now();
    const response = await getUserByIdApi(request, body.id);
    const end   = Date.now();
    console.log('Get by ID response:', response);
    // ── 1. Status & Headers ──────────────────────────
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
    // ── 2. Schema ────────────────────────────────────
    const result = UserSchema.safeParse(await response.json());
    console.log('Schema validation result:', result);
    if (!result.success) {
      console.error('Schema validation failed:', result.error);
    }
    expect(result.success).toBe(true);
    // ── 3. Value correctness ─────────────────────────
    const user = result.data;
    expect(user.id).toBe(body.id);
    expect(user.name).toBe(name);
    expect(user.job).toBe(job);
    
    // ── 4. Response time (optional) ─────────────────────────
    const duration = end - start;
    console.log(`Response time: ${duration}ms`);
    expect(duration).toBeLessThan(1000); // Example threshold

    // ── 5. No sensitive data ──────────────────────────
    expect(user).not.toHaveProperty('password');
    expect(user).not.toHaveProperty('token');
    
  });

  test('should return 404 for a non-existent ID', async ({ request }) => {
    const response = await getUserByIdApi(request, 9999999);
    expect(response.status()).toBe(404);

    const body = await response.json();
    expect(body).toHaveProperty('message');
    expect(body.message).toContain('User not found.');
  });
});


test.describe('API - DELETE /api/users/:id (Delete User)', () => {

  test('should delete a user and return success message', async ({ request }) => {
    const { body: created } = await createUserAndGetBody(request, 'DeleteMe', 'Temp');

    const deleteResponse = await deleteUserApi(request, created.id);
    expect(deleteResponse.status()).toBe(200);

    const body = await deleteResponse.json();
    expect(body.message).toContain('deleted');
  });

  test('deleted user should no longer appear in GET all', async ({ request }) => {
    const { body: created } = await createUserAndGetBody(request, 'GoneUser', 'Temp');
    await deleteUserApi(request, created.id);

    const listResponse = await getUsersApi(request);
    const users = await listResponse.json();
    const found = users.find(u => u.id === created.id);
    expect(found).toBeUndefined();
  });

  test('deleted user should return 404 on GET by ID', async ({ request }) => {
    const { body: created } = await createUserAndGetBody(request, 'Ghost', 'Temp');
    await deleteUserApi(request, created.id);

    const getResponse = await getUserByIdApi(request, created.id);
    expect(getResponse.status()).toBe(404);
  });
});
