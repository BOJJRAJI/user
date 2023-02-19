const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//API for add user
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);

  const userDetails = `SELECT * FROM user WHERE username ='${username}'`;
  const dbUser = await db.get(userDetails);

  if (dbUser === undefined) {
    if (length(request.body.password) < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const addUserDetailsQuery = `
               INSERT INTO user (username,name ,password, gender, location)
          VALUES (
           '${username}',
        '${name}',
        '${hashedPassword}',
       '${gender}',
         '${location}')
           `;
      const dbResponse = await db.run(addUserDetailsQuery);
      const newUserId = dbResponse.lastID;
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API2
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const userDetails = `SELECT * FROM user WHERE username ='${username}'`;
  const dbUser = await db.get(userDetails);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordValid = await bcrypt.compare(
      request.body.password,
      dbUser.password
    );
    if (isPasswordValid === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 3 update

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const userDetails = `SELECT * FROM user WHERE username ='${username}'`;
  const dbUser = await db.get(userDetails);

  //const isPasswordValid = await bcrypt.compare(request.body.oldPassword, dbUser.password );
  if (dbUser === undefined) {
    response.status(400);
    response.send("User not registered");
  } else {
    const isPasswordValid = await bcrypt.compare(oldPassword, dbUser.password);
    if (isPasswordValid === true) {
      const lengthOfPassword = newPassword.length;
      if (lengthOfPassword < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updateUserPasswordQuery = `
                     UPDATE user SET 
                     password='${hashedPassword}' 
                     WHERE username ='${username}'
                     `;
        await db.run(updateUserPasswordQuery);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
