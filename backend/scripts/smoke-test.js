// A beginner-friendly end-to-end check. With the server running, execute:
//   npm run smoke
// It walks through the whole auth flow and prints PASS/FAIL for each step.
const BASE_URL = process.env.API_URL || "http://localhost:5000/api";

let failures = 0;

async function call(method, path, { body, token } = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await response.json();
  return { status: response.status, json };
}

function check(label, condition, details = "") {
  if (condition) {
    console.log(`PASS  ${label}`);
  } else {
    failures++;
    console.log(`FAIL  ${label} ${details}`);
  }
}

async function main() {
  const email = `smoke.${Date.now()}@example.com`;
  const password = "Passw0rdTest";
  let res;

  res = await call("GET", "/health");
  check("health check returns 200", res.status === 200);
  check("database is connected", res.json.data?.database === "connected");

  res = await call("POST", "/auth/register", { body: { name: "A", email: "bad", password: "123" } });
  check("register with invalid data returns 400", res.status === 400);
  check("validation errors are listed", Array.isArray(res.json.errors) && res.json.errors.length >= 3);

  res = await call("POST", "/auth/register", { body: { name: "Smoke Tester", email, password } });
  check("register returns 201", res.status === 201, JSON.stringify(res.json));
  check("register returns a token", typeof res.json.data?.token === "string");
  check("password is never returned", res.json.data?.user?.password === undefined);

  res = await call("POST", "/auth/register", { body: { name: "Smoke Tester", email, password } });
  check("registering the same email again returns 409", res.status === 409);

  res = await call("POST", "/auth/login", { body: { email, password: "WrongPassword1" } });
  check("login with wrong password returns 401", res.status === 401);

  res = await call("POST", "/auth/login", { body: { email, password } });
  check("login returns 200", res.status === 200, JSON.stringify(res.json));
  const token = res.json.data?.token;

  res = await call("GET", "/users/me");
  check("GET /users/me without token returns 401", res.status === 401);

  res = await call("GET", "/users/me", { token });
  check("GET /users/me with token returns 200", res.status === 200);
  check("profile email matches", res.json.data?.user?.email === email);

  res = await call("PATCH", "/users/me", { token, body: { name: "Renamed Tester" } });
  check("PATCH /users/me updates the name", res.status === 200 && res.json.data?.user?.name === "Renamed Tester");

  res = await call("POST", "/auth/logout", { token });
  check("logout returns 200", res.status === 200);

  res = await call("GET", "/users/me", { token });
  check("old token is rejected after logout (401)", res.status === 401);

  res = await call("GET", "/does-not-exist");
  check("unknown route returns 404", res.status === 404);

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error("Smoke test crashed. Is the server running?", error.message);
  process.exit(1);
});
