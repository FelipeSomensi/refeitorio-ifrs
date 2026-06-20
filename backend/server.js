require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const users = require("./users");
const cardapios = require("./cardapios");

const app = express();

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// MIDDLEWARE TOKEN
const verifyToken = (req, res, next) => {
  const { authorization } = req.headers;
  const token = authorization && authorization.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token não enviado" });
  }

  try {
    const decoded = jwt.verify(token, PRIVATE_KEY);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Token inválido" });
  }
};

// MIDDLEWARE SERVIDOR/ADMIN
const verifyServidor = (req, res, next) => {
  if (req.user.type !== "servidor") {
    return res.status(403).json({
      error: "Acesso permitido apenas para servidores",
    });
  }
  next();
};

// ROTA INICIAL
app.get("/", (_, res) => {
  return res.json({ message: "API funcionando" });
});

// LOGIN
app.post("/login", (req, res) => {
  const { login, pwd } = req.body;
  const user = users.find((u) => u.login === login && u.pwd === pwd);

  if (!user) {
    return res.status(403).json({ error: "Usuário ou senha inválidos" });
  }

  const token = jwt.sign(
    { id: user.id, login: user.login, type: user.type },
    PRIVATE_KEY,
    { expiresIn: "1h" },
  );

  return res.json({ token, type: user.type });
});

// LISTAR CARDÁPIOS (qualquer usuário logado)
app.get("/cardapio", verifyToken, (req, res) => {
  return res.json(cardapios);
});

// CADASTRAR CARDÁPIO (apenas servidor/admin)
app.post("/cardapio", verifyToken, verifyServidor, (req, res) => {
  const { dia, tipo, itens } = req.body;

  if (!dia || !tipo || !itens || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({
      error: "Campos obrigatórios: dia (YYYY-MM-DD), tipo, itens (array)",
    });
  }

  const existente = cardapios.findIndex(
    (c) => c.dia === dia && c.tipo === tipo,
  );

  if (existente !== -1) {
    // Atualiza se já existe o mesmo dia+tipo
    cardapios[existente] = { dia, tipo, itens };
    return res.json({
      message: "Cardápio atualizado com sucesso",
      cardapio: cardapios[existente],
    });
  }

  const novo = { dia, tipo, itens };
  cardapios.push(novo);

  return res
    .status(201)
    .json({ message: "Cardápio cadastrado com sucesso", cardapio: novo });
});

// DELETAR CARDÁPIO (apenas servidor/admin)
app.delete("/cardapio", verifyToken, verifyServidor, (req, res) => {
  const { dia, tipo } = req.body;

  const index = cardapios.findIndex((c) => c.dia === dia && c.tipo === tipo);

  if (index === -1) {
    return res.status(404).json({ error: "Cardápio não encontrado" });
  }

  cardapios.splice(index, 1);
  return res.json({ message: "Cardápio removido com sucesso" });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
