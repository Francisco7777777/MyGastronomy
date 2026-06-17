import express, { json } from "express";
import cors from "cors";
import { Mongo } from "./database/mongo.js";
import { config } from "dotenv";
import authRouter from "./auth/auth.js";
import usersRouter from "./routes/users.js";
import platesRouter from "./routes/plates.js";

config();

// Função principal da aplicação.
async function maim() {
  const hostname = "localhost"; // Definir anfitrião local.
  const port = 3000; // Porta

  const app = express();

  const mongoConnection = await Mongo.connect({
    mongoConnectionString: process.env.MONGO_CS,
    mongoDbName: process.env.MONGO_DB_NAME,
  });
  console.log(mongoConnection);

  app.use(express.json());

  app.get("/", (req, res) => {
    res.send({
      success: true,
      statusCode: 200,
      body: "Welcome to MyGastronomy!",
    });
  });

  // Rotas
  app.use("/auth", authRouter);
  app.use("/users", usersRouter);
  app.use("/plates", platesRouter);

  app.listen(port, () => {
    console.log(`Server running on http://${hostname}:${port}`);
  });
}

maim();
