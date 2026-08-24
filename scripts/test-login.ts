import "dotenv/config";
import { loginEmployee } from "../actions/auth";

async function testLogin() {
  const result = await loginEmployee({
    email: "mclemente08@firstasia.edu.ph",
    password: "Password123!",
  });

  console.log("Login test result:", result);
}

testLogin().catch(console.error);
