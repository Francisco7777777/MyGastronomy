import UsersDataAccess from "../dataAccess/users.js";
import { ok, serverError } from "../helpers/httpResponse.js";

export default class UsersControllers {
  constructor() {
    this.dataAccess = new UsersDataAccess();
  }

  getUsers = async (req, res) => {
    try {
      const users = await this.dataAccess.getUsers();

      // Pegamos o objeto gerado pelo helper helper 'ok'
      const response = ok(users);

      return res.status(response.statusCode).json(response);
    } catch (error) {
      const response = serverError(error);

      // Em caso de erro, responde com status 500 do nosso helper
      return res.status(response.statusCode).json(response);
    }
  };

  deleteUser = async (req, res) => {
    try {
      const userId = req.params.id;

      // Chama o seu DataAccess para deletar no banco
      const result = await this.dataAccess.deleteUser(userId);

      if (result.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          statusCode: 404,
          body: { text: "User not found to delete!!!" },
        });
      }

      return res.status(200).json({
        success: true,
        statusCode: 200,
        body: { text: "User deleted correctly!!!" },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        statusCode: 500,
        body: { text: "Internal Server Error", error: error.message },
      });
    }
  };

  updateUser = async (req, res) => {
    try {
      const userId = req.params.id;
      let userData = req.body; // Declarado aqui no topo para estar disponível em todo o método

      // 1. Se o cliente enviou uma nova senha, nós a criptografamos antes de enviar ao banco
      if (userData.password) {
        const salt = crypto.randomBytes(16);

        // Usando a versão Síncrona do PBKDF2 para rodar linha por linha de forma limpa
        const hashedPassword = crypto.pbkdf2Sync(
          userData.password,
          salt,
          310000,
          16,
          "sha256",
        );

        // Atualiza o objeto com a senha criptografada e o novo salt
        userData = { ...userData, password: hashedPassword, salt };
      }

      // 2. Um único caminho para atualizar o banco, independentemente de ter mudado a senha ou não
      const result = await this.dataAccess.updateUser(userId, userData);

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          statusCode: 404,
          body: { text: "User not found to update!!!" },
        });
      }

      const response = ok({ text: "User updated correctly!!!", result });
      return res.status(response.statusCode).json(response);
    } catch (error) {
      const response = serverError(error);
      return res.status(response.statusCode).json(response);
    }
  };
}
