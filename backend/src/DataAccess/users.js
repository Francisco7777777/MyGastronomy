// Comunicação entre o node e o mongo db.

import { Mongo } from "../database/mongo.js";
import { ObjectId } from "mongodb";
import crypto from "crypto";

const collectionName = "users";

export default class UsersDataAccess {
  // Busca o usuários
  async getUsers() {
    const result = await Mongo.db.collection(collectionName).find({}).toArray();
    return result;
  }

  // Deletar Usuário (Base para você implementar)
  async deleteUser(userId) {
    const result = await Mongo.db
      .collection(collectionName)
      .findOneAndDelete({ _id: new ObjectId(userId) });
    return result;
  }

  // Atualizar Usuário (Base para você implementar)
  async updateUser(userId, userData) {
    const result = await Mongo.db
      .collection(collectionName)
      .findOneAndUpdate({ _id: new ObjectId(userId) }, { $set: userData });
    return result;
  }
}
