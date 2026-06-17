// Autenticação!
import express from "express";
import passport from "passport";
import localStrategy from "passport-local";
import crypto from "crypto";
import { Mongo } from "../database/mongo.js";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { error } from "console";
import { text } from "stream/consumers";

//
// Registro do usuário
//
const collectionName = "users";

// Estratégia de Login do Passport
passport.use(
  new localStrategy(
    { usernameField: "email" },
    async (email, password, callback) => {
      try {
        const user = await Mongo.db
          .collection(collectionName)
          .findOne({ email: email });

        if (!user) {
          return callback(null, false, { message: "Usuário não encontrado." });
        }

        // Garante que estamos lidando com buffers corretos vindos do MongoDB
        const saltBuffer = Buffer.isBuffer(user.salt)
          ? user.salt
          : Buffer.from(user.salt.buffer || user.salt);
        const userPasswordBuffer = Buffer.isBuffer(user.password)
          ? user.password
          : Buffer.from(user.password.buffer || user.password);

        crypto.pbkdf2(
          password,
          saltBuffer,
          310000,
          16,
          "sha256",
          (err, hashedPassword) => {
            if (err) {
              return callback(err, false);
            }

            if (!crypto.timingSafeEqual(userPasswordBuffer, hashedPassword)) {
              return callback(null, false, { message: "Senha incorreta." });
            }

            // Remove campos sensíveis antes de retornar
            const { password: _, salt: __, ...rest } = user;
            return callback(null, rest);
          },
        );
      } catch (error) {
        return callback(error, false);
      }
    },
  ),
);

// Rota
const authRouter = express.Router();

authRouter.post("/signup", async (req, res) => {
  try {
    // Proteção contra requisições sem body (Evita o crash de undefined)
    if (!req.body || !req.body.email || !req.body.password) {
      return res.status(400).send({
        success: false,
        statusCode: 400,
        body: { text: "E-mail e senha são obrigatórios!" },
      });
    }

    const { email, password } = req.body;

    // Verificar se usuário já existe
    const checkUser = await Mongo.db
      .collection(collectionName)
      .findOne({ email: email });

    if (checkUser) {
      return res.status(400).send({
        success: false,
        statusCode: 400,
        body: { text: "User already exists!!!" },
      });
    }

    // Gerar Salt e Hash da senha
    const salt = crypto.randomBytes(16);

    crypto.pbkdf2(
      password,
      salt,
      310000,
      16,
      "sha256",
      async (err, hashedPassword) => {
        if (err) {
          return res.status(500).send({
            success: false,
            statusCode: 500,
            body: {
              text: "Error on crypto password!!!",
              err: err.message,
            },
          });
        }

        // Salvar no banco de dados
        const result = await Mongo.db.collection(collectionName).insertOne({
          email: email,
          password: hashedPassword,
          salt: salt,
        });

        if (result.insertedId) {
          const user = await Mongo.db
            .collection(collectionName)
            .findOne({ _id: new ObjectId(result.insertedId) });

          // CORRIGIDO: O JWT não aceita bem instâncias de ObjectId e Buffers complexos.
          // É melhor assinar apenas dados simples, como o ID e o email.
          const payload = {
            id: user._id.toString(),
            email: user.email,
          };

          const token = jwt.sign(payload, "secret", { expiresIn: "1d" });

          delete user.password;
          delete user.salt;

          return res.status(201).send({
            success: true,
            statusCode: 201,
            body: {
              text: "User registered correctly!!!",
              token,
              user,
              logged: true,
            },
          });
        }
      },
    );
  } catch (error) {
    return res.status(500).send({
      success: false,
      statusCode: 500,
      body: { text: "Internal Server Error", error: error.message },
    });
  }
});

//
// Login
//
authRouter.post("/login", (req, res, next) => {
  passport.authenticate("local", { session: false }, (error, user, info) => {
    // Tratamento de erro do servidor/banco
    if (error) {
      return res.status(500).send({
        success: false,
        statusCode: 500,
        body: {
          text: "Error during authentication!!!",
          error: error.message,
        },
      });
    }

    // Se o usuário não foi encontrado ou a senha está errada
    if (!user) {
      return res.status(401).send({
        // Mudado para 401 (Unauthorized) que é o correto para falha de login
        success: false,
        statusCode: 401,
        body: {
          text:
            info && info.message
              ? info.message
              : "Invalid email or password!!!",
        },
      });
    }

    // Simplificando o payload do JWT para evitar quebra com Objetos complexos do Mongo
    const payload = {
      id: user._id.toString(),
      email: user.email,
    };

    // Gerando o token (com expiração de 1 dia por boa prática)
    const token = jwt.sign(payload, "secret", { expiresIn: "1d" });

    // Garantindo que dados sensíveis não vão voltar para o frontend caso existam no objeto
    delete user.password;
    delete user.salt;

    // 4. Resposta de sucesso
    return res.status(200).send({
      success: true,
      statusCode: 200,
      body: {
        text: "User logged in correctly!!!",
        user,
        token,
        logged: true,
      },
    });
  })(req, res, next); // Passado o 'next' aqui por boa prática do Express
});

export default authRouter;
