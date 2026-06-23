require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const users = require("./users");
const cardapios = require("./cardapios"); // atribuições: { dia, modeloId }
const modelos = require("./modelos"); // modelos reutilizáveis: { id, tipo, itens }
const favoritos = require("./favoritos"); // favoritos pessoais: { usuarioId, modeloId }

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

// Junta uma atribuição (dia + modeloId) com o conteúdo do modelo,
// marcando se o modelo é favorito do usuário logado
function montarCardapioCompleto(atribuicao, usuarioId) {
  const modelo = modelos.find((m) => m.id === atribuicao.modeloId);
  if (!modelo) return null;
  return {
    dia: atribuicao.dia,
    modeloId: modelo.id,
    tipo: modelo.tipo,
    itens: modelo.itens,
    favorito: favoritos.some(
      (f) => f.usuarioId === usuarioId && f.modeloId === modelo.id,
    ),
  };
}

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

// ===================== CARDÁPIOS (ATRIBUIÇÕES POR DIA) =====================

// LISTAR CARDÁPIOS (qualquer usuário logado)
// Mantém o formato { dia, tipo, itens } esperado pelo app, com modeloId e favorito extras
app.get("/cardapio", verifyToken, (req, res) => {
  const completos = cardapios
    .map((c) => montarCardapioCompleto(c, req.user.id))
    .filter((c) => c !== null);

  return res.json(completos);
});

// ATRIBUIR um modelo existente (ou recém-criado) a um dia (apenas servidor/admin)
app.post("/cardapio", verifyToken, verifyServidor, (req, res) => {
  const { dia, modeloId } = req.body;

  if (!dia || !modeloId) {
    return res.status(400).json({
      error: "Campos obrigatórios: dia (YYYY-MM-DD), modeloId",
    });
  }

  const modelo = modelos.find((m) => m.id === Number(modeloId));
  if (!modelo) {
    return res.status(404).json({ error: "Modelo de cardápio não encontrado" });
  }

  const existente = cardapios.findIndex(
    (c) => c.dia === dia && c.modeloId === Number(modeloId),
  );

  if (existente !== -1) {
    return res.status(409).json({
      error: "Este cardápio já está atribuído a este dia",
    });
  }

  const nova = { dia, modeloId: Number(modeloId) };
  cardapios.push(nova);

  return res.status(201).json({
    message: "Cardápio atribuído ao dia com sucesso",
    cardapio: montarCardapioCompleto(nova, req.user.id),
  });
});

// REMOVER a atribuição de um modelo a um dia (apenas servidor/admin)
// Não exclui o modelo, só desvincula do dia.
app.delete("/cardapio", verifyToken, verifyServidor, (req, res) => {
  const { dia, modeloId } = req.body;

  const index = cardapios.findIndex(
    (c) => c.dia === dia && c.modeloId === Number(modeloId),
  );

  if (index === -1) {
    return res.status(404).json({ error: "Atribuição não encontrada" });
  }

  cardapios.splice(index, 1);
  return res.json({ message: "Cardápio removido do dia com sucesso" });
});

// ===================== MODELOS DE CARDÁPIO (REUTILIZÁVEIS) =====================

// LISTAR MODELOS (apenas servidor/admin) — usado na hora de "reutilizar" um cardápio
app.get("/modelos", verifyToken, verifyServidor, (req, res) => {
  return res.json(modelos);
});

// CRIAR NOVO MODELO (apenas servidor/admin) — não atribui a nenhum dia ainda
app.post("/modelos", verifyToken, verifyServidor, (req, res) => {
  const { tipo, itens } = req.body;

  if (!tipo || !itens || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({
      error: "Campos obrigatórios: tipo, itens (array)",
    });
  }

  const novoId =
    modelos.length > 0 ? Math.max(...modelos.map((m) => m.id)) + 1 : 1;
  const novoModelo = { id: novoId, tipo, itens };
  modelos.push(novoModelo);

  return res.status(201).json({
    message: "Modelo de cardápio criado com sucesso",
    modelo: novoModelo,
  });
});

// EXCLUIR MODELO (apenas servidor/admin) — bloqueia se estiver em uso em algum dia
app.delete("/modelos/:id", verifyToken, verifyServidor, (req, res) => {
  const id = Number(req.params.id);

  const emUso = cardapios.some((c) => c.modeloId === id);
  if (emUso) {
    return res.status(409).json({
      error:
        "Este modelo está atribuído a um ou mais dias. Remova as atribuições antes de excluir.",
    });
  }

  const index = modelos.findIndex((m) => m.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Modelo não encontrado" });
  }

  modelos.splice(index, 1);
  return res.json({ message: "Modelo excluído com sucesso" });
});

// ===================== FAVORITOS (PESSOAIS POR USUÁRIO) =====================

// LISTAR MEUS FAVORITOS — para cada modelo favoritado, traz o conteúdo
// e todos os dias (datas) em que esse modelo está atribuído atualmente.
app.get("/favoritos", verifyToken, (req, res) => {
  const meusFavoritos = favoritos.filter((f) => f.usuarioId === req.user.id);

  const completos = meusFavoritos
    .map((f) => {
      const modelo = modelos.find((m) => m.id === f.modeloId);
      if (!modelo) return null;

      const dias = cardapios
        .filter((c) => c.modeloId === modelo.id)
        .map((c) => c.dia)
        .sort();

      return {
        modeloId: modelo.id,
        tipo: modelo.tipo,
        itens: modelo.itens,
        dias, // todos os dias em que esse cardápio favoritado aparece
      };
    })
    .filter((c) => c !== null);

  return res.json(completos);
});

// FAVORITAR um modelo de cardápio (qualquer usuário logado)
app.post("/favoritos", verifyToken, (req, res) => {
  const { modeloId } = req.body;

  if (!modeloId) {
    return res.status(400).json({ error: "Campo obrigatório: modeloId" });
  }

  const modelo = modelos.find((m) => m.id === Number(modeloId));
  if (!modelo) {
    return res.status(404).json({ error: "Modelo de cardápio não encontrado" });
  }

  const jaFavoritado = favoritos.some(
    (f) => f.usuarioId === req.user.id && f.modeloId === Number(modeloId),
  );

  if (jaFavoritado) {
    return res
      .status(409)
      .json({ error: "Este cardápio já está nos seus favoritos" });
  }

  favoritos.push({ usuarioId: req.user.id, modeloId: Number(modeloId) });

  return res.status(201).json({ message: "Cardápio adicionado aos favoritos" });
});

// DESFAVORITAR um modelo de cardápio (qualquer usuário logado)
app.delete("/favoritos/:modeloId", verifyToken, (req, res) => {
  const modeloId = Number(req.params.modeloId);

  const index = favoritos.findIndex(
    (f) => f.usuarioId === req.user.id && f.modeloId === modeloId,
  );

  if (index === -1) {
    return res.status(404).json({ error: "Favorito não encontrado" });
  }

  favoritos.splice(index, 1);
  return res.json({ message: "Cardápio removido dos favoritos" });
});

// ===================== USUÁRIOS =====================

// LISTAR USUÁRIOS (apenas servidor/admin) — nunca retorna a senha
app.get("/usuarios", verifyToken, verifyServidor, (req, res) => {
  const usuariosSemSenha = users.map(({ pwd, ...resto }) => resto);
  return res.json(usuariosSemSenha);
});

// CADASTRAR USUÁRIO (apenas servidor/admin)
app.post("/usuarios", verifyToken, verifyServidor, (req, res) => {
  const { login, pwd, type } = req.body;

  if (!login || !pwd || !type) {
    return res.status(400).json({
      error: "Campos obrigatórios: login, pwd, type",
    });
  }

  if (type !== "aluno" && type !== "servidor") {
    return res.status(400).json({
      error: "type deve ser 'aluno' ou 'servidor'",
    });
  }

  const jaExiste = users.find((u) => u.login === login);
  if (jaExiste) {
    return res
      .status(409)
      .json({ error: "Já existe um usuário com esse login" });
  }

  const novoId = users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;

  const novoUsuario = { id: novoId, login, pwd, type };
  users.push(novoUsuario);

  const { pwd: _, ...semSenha } = novoUsuario;
  return res
    .status(201)
    .json({ message: "Usuário cadastrado com sucesso", usuario: semSenha });
});

// EDITAR USUÁRIO (apenas servidor/admin) — não pode editar o próprio usuário logado
app.put("/usuarios/:id", verifyToken, verifyServidor, (req, res) => {
  const id = Number(req.params.id);
  const { login, pwd, type } = req.body;

  if (id === req.user.id) {
    return res.status(403).json({
      error: "Você não pode editar seu próprio usuário enquanto estiver logado",
    });
  }

  const index = users.findIndex((u) => u.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Usuário não encontrado" });
  }

  if (type && type !== "aluno" && type !== "servidor") {
    return res
      .status(400)
      .json({ error: "type deve ser 'aluno' ou 'servidor'" });
  }

  if (login && login !== users[index].login) {
    const loginEmUso = users.find((u) => u.login === login && u.id !== id);
    if (loginEmUso) {
      return res
        .status(409)
        .json({ error: "Já existe um usuário com esse login" });
    }
  }

  users[index] = {
    ...users[index],
    login: login ?? users[index].login,
    pwd: pwd ?? users[index].pwd,
    type: type ?? users[index].type,
  };

  const { pwd: _, ...semSenha } = users[index];
  return res.json({
    message: "Usuário atualizado com sucesso",
    usuario: semSenha,
  });
});

// EXCLUIR USUÁRIO (apenas servidor/admin) — não pode excluir o próprio usuário logado
app.delete("/usuarios/:id", verifyToken, verifyServidor, (req, res) => {
  const id = Number(req.params.id);

  if (id === req.user.id) {
    return res.status(403).json({
      error:
        "Você não pode excluir seu próprio usuário enquanto estiver logado",
    });
  }

  const index = users.findIndex((u) => u.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Usuário não encontrado" });
  }

  users.splice(index, 1);
  return res.json({ message: "Usuário excluído com sucesso" });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
