// helpers/apiHelper.js
// Thin wrapper around Playwright's APIRequestContext for clean, reusable API calls

/**
 * @param {import('@playwright/test').APIRequestContext} request
 */

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const USERS_ENDPOINT = `${BASE}/api/users`;

/** POST /api/users - Create a user */
export async function createUserApi(request, name, job) {
  const response = await request.post(USERS_ENDPOINT, {
    data: { name, job },
  });
  return response;
}

/** GET /api/users - Get all users */
export async function getUsersApi(request) {
  const response = await request.get(USERS_ENDPOINT);
  return response;
}

/** GET /api/users/:id - Get user by ID */
export async function getUserByIdApi(request, id) {
  const response = await request.get(`${USERS_ENDPOINT}/${id}`);
  return response;
}

/** DELETE /api/users/:id - Delete user */
export async function deleteUserApi(request, id) {
  const response = await request.delete(`${USERS_ENDPOINT}/${id}`);
  return response;
}

/** Helper: create user and return parsed JSON body and response */
export async function createUserAndGetBody(request, name, job) {
  const response = await createUserApi(request, name, job);
  const body = await response.json();
  return { response, body };
}
/** Helper: create user return parsed JSON body */
export async function createUserGetBody(request, name, job) {
  const response = await createUserApi(request, name, job);
  const body = await response.json();
  return body;
}
