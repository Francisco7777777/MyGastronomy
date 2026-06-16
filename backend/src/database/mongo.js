//  Módulo de de conexão com a base de dados.

import { text } from "express";
import { MongoClient } from "mongodb";

export const Mongo = {
  async connect({ mongoConnectionString, mongoDbName }) {
    try {
      const client = new MongoClient(mongoConnectionString);
      await client.connect();
      const db = client.db(mongoDbName);

      this.client = client;
      this.db = db;

      return "Connected to mongo!!!";
    } catch (error) {
      return { text: "Erro doring mongo connection!!!", error };
    }
  },
};
