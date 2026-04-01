// tests/db/users.db.test.js
// Direct DB layer tests — validates data integrity, persistence,
// and DB state independent of the API or UI layer

import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import {
  getAllUsersFromDB,
  getUserByIdFromDB,
  getUserByNameFromDB,
  insertUserIntoDB,
  deleteUserFromDB,
  deleteUserByNameFromDB,
  countUsers,
  userExistsInDB,
} from '../../helpers/dbHelper.js';


test.describe('DB - Direct Data Access', () => {

  test('should connect to DB and return an array of users', async () => {
    const users = await getAllUsersFromDB();
    console.log('Users in DB:', users);
    expect(Array.isArray(users)).toBe(true);
  });

  test.only('Validate insert single user scenarios', async () => {
    // Insert a known user so at least one row exists
    const name = faker.person.fullName();
    const job = faker.person.jobTitle();
    const inserted = await insertUserIntoDB(name, job);
    console.log('Inserted user:', inserted);
    const id=inserted.id;
    expect(id).toBeGreaterThan(0);
    expect(inserted.name).toBe(name);
    expect(inserted.job).toBe(job);
    expect(typeof id).toBe('number');
    
    const fetched = await getUserByIdFromDB(id);
    console.log('Fetched user by ID:', fetched);
    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(id);
    expect(fetched.name).toBe(name);
    expect(fetched.job).toBe(job);

    // const users = await getAllUsersFromDB();
    // expect(users.length).toBeGreaterThan(0);

    // const sample = users[0];
    // expect(sample).toHaveProperty('id');
    // expect(sample).toHaveProperty('name');
    // expect(sample).toHaveProperty('job');

    // await deleteUserFromDB(inserted.id);
  });
});


test.describe('DB - Insert & Retrieve', () => {

  test('should insert a user directly and retrieve by ID', async () => {
    const { id, name, job } = await insertUserIntoDB('DB_Insert', 'Engineer');

    const fetched = await getUserByIdFromDB(id);
    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(id);
    expect(fetched.name).toBe('DB_Insert');
    expect(fetched.job).toBe('Engineer');

    await deleteUserFromDB(id);
  });

  test('should retrieve user by name', async () => {
    const { id } = await insertUserIntoDB('DB_ByName', 'DevOps');

    const fetched = await getUserByNameFromDB('DB_ByName');
    expect(fetched).not.toBeNull();
    expect(fetched.name).toBe('DB_ByName');

    await deleteUserFromDB(id);
  });

  test('insertId should be a positive integer', async () => {
    const { id } = await insertUserIntoDB('DB_IdCheck', 'QA');
    expect(typeof id).toBe('number');
    expect(id).toBeGreaterThan(0);
    await deleteUserFromDB(id);
  });

  test('two inserts should produce incrementing IDs', async () => {
    const u1 = await insertUserIntoDB('DB_Inc1', 'DevA');
    const u2 = await insertUserIntoDB('DB_Inc2', 'DevB');
    expect(u2.id).toBeGreaterThan(u1.id);
    await deleteUserFromDB(u1.id);
    await deleteUserFromDB(u2.id);
  });
});


test.describe('DB - Delete & Verification', () => {

  test('should delete a user by ID and confirm absence', async () => {
    const { id } = await insertUserIntoDB('DB_Delete', 'Temp');
    await deleteUserFromDB(id);

    const fetched = await getUserByIdFromDB(id);
    expect(fetched).toBeNull();
  });

  test('userExistsInDB should return true for existing user', async () => {
    const { id } = await insertUserIntoDB('DB_Exists', 'DevOps');
    const exists = await userExistsInDB('DB_Exists', 'DevOps');
    expect(exists).toBe(true);
    await deleteUserFromDB(id);
  });

  test('userExistsInDB should return false after deletion', async () => {
    const { id } = await insertUserIntoDB('DB_Gone', 'Temp');
    await deleteUserFromDB(id);
    const exists = await userExistsInDB('DB_Gone', 'Temp');
    expect(exists).toBe(false);
  });
});


test.describe('DB - Count & Consistency', () => {

  test('countUsers should increase by 1 after insert', async () => {
    const before = await countUsers();
    const { id } = await insertUserIntoDB('DB_Count', 'Counter');
    const after = await countUsers();
    expect(after).toBe(Number(before) + 1);
    await deleteUserFromDB(id);
  });

  test('countUsers should decrease by 1 after delete', async () => {
    const { id } = await insertUserIntoDB('DB_CountDel', 'Counter');
    const before = await countUsers();
    await deleteUserFromDB(id);
    const after = await countUsers();
    expect(Number(after)).toBe(Number(before) - 1);
  });

  test('non-existent user ID should return null', async () => {
    const user = await getUserByIdFromDB(9999999);
    expect(user).toBeNull();
  });
});
