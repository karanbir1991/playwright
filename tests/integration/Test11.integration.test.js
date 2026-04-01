import { test, expect } from '../../fixtures/fixtures.js';
import {faker} from '@faker-js/faker';
import { withHeadedPage } from '../../helpers/browserHelper.js';
import { CreateUserPage } from '../../pages/CreateUserPage.js';
import { UserListPage }   from '../../pages/UserListPage.js';
import {
  createUserApi,
  getUsersApi,
    getUserByIdApi,
    deleteUserApi,
    createUserAndGetBody,
    createUserGetBody,
} from '../../helpers/apiHelper.js';
import {
  getUserByIdFromDB,
  getUserByNameFromDB,
    userExistsInDB,
    countUsers,
    deleteUserByNameFromDB,
} from '../../helpers/dbHelper.js';
import{UserSchema,
    UsersArraySchema,
    ErrorSchema,
    
}  from '../../helpers/schemaHelper.js';


test.describe('Integration - validation cases for API<>UI<>DB', () => {
 test('verify user created by API is present in DB and UI', async ({ request, browser}) => {
 
    // Create user via API
    const name = faker.person.fullName();
    const job = faker.person.jobTitle();
    const { response,body } = await createUserAndGetBody(request, name, job);
    const userId = body.id;
    console.log('API response body:', body);
    expect(body.name).toBe(name);
    expect(body.job).toBe(job);
    expect(typeof userId).toBe('number');
    expect(userId).toBeGreaterThan(0);
    expect(response.status()).toBe(201);
    expect(response.statusText()).toBe('Created');
    expect(response.headers()['content-type']).toContain('application/json');
    const result = UserSchema.safeParse(body);
    console.log('Schema validation result:', result);
    if (!result.success) {
      console.error('Schema validation failed:', result.error);
    }
    expect(result.success).toBe(true);
   

    // Verify user exists in DB
    const dbUser = await getUserByIdFromDB(userId);
    console.log('User fetched from DB:', dbUser);
    expect(dbUser).not.toBeNull();
    expect(dbUser.name).toBe(name);
    expect(dbUser.job).toBe(job);
    console.log('DB user matches API response:', dbUser.id === userId && dbUser.name === name && dbUser.job === job);   

    // Verify user exists in UI list
    await withHeadedPage(browser, async (page) => {
    const createUserPage = new CreateUserPage(page);
    const userListPage   = new UserListPage(page);

    await createUserPage.goto();
    await createUserPage.redirectToUserList();

    const { uiname, uijob } = await userListPage.searchById(body.id);
    expect(uiname).toBe(name);
    expect(uijob).toBe(job);
    console.log('UI user matches API response:', uiname === name && uijob === job);
  });
    

});
});