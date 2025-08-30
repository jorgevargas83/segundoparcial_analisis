let ultimoComando = { accion: "ninguno", time: Date.now() };

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { accion } = req.body;
    ultimoComando = { accion, time: Date.now() };
    return res.status(200).json({ ok: true });
  }

  if (req.method === "GET") {
    return res.status(200).json(ultimoComando);
  }

  return res.status(405).end();
}
