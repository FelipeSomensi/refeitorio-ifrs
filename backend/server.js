require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const users = require("./users");

const app = express();

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// ROTA INICIAL
app.get("/", (_, res) => {
  return res.json({
    message: "API funcionando",
  });
});

// LOGIN
app.post("/login", (req, res) => {
  const { login, pwd } = req.body;

  const user = users.find((u) => u.login === login && u.pwd === pwd);

  if (!user) {
    return res.status(403).json({
      error: "Usuário ou senha inválidos",
    });
  }

  const token = jwt.sign(
    {
      id: user.id,
      login: user.login,
      type: user.type,
    },

    PRIVATE_KEY,

    {
      expiresIn: "1h",
    },
  );

  return res.json({
    token,
  });
});

// MIDDLEWARE TOKEN
const verifyToken = (req, res, next) => {
  const { authorization } = req.headers;

  const token = authorization && authorization.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      error: "Token não enviado",
    });
  }

  try {
    const decoded = jwt.verify(token, PRIVATE_KEY);

    req.user = decoded;

    next();
  } catch (e) {
    return res.status(401).json({
      error: "Token inválido",
    });
  }
};

// MIDDLEWARE TIPO
const verifyServidor = (req, res, next) => {
  console.log("Verificando servidor");
  if (req.user.type !== "servidor") {
    return res.status(403).json({
      error: "Acesso permitido apenas para servidores",
    });
  }

  next();
};

// ROTA PROTEGIDA
app.get(
  "/dashboard",
  verifyToken,
  verifyServidor,

  (req, res) => {
    return res.json({
      message: `Bem-vindo ${req.user.login}`,
    });
  },
);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
