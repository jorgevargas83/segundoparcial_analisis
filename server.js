const express = require("express");
const app = express();
const http = require("http").createServer(app);
const { Server } = require("socket.io");
const io = new Server(http, {
  cors: { origin: "*" }
});

// 👉 Servir los HTML desde la carpeta "public"
app.use(express.static(__dirname + "/public"));

let invitados = [];

io.on("connection", (socket) => {
  console.log("✅ Nuevo cliente conectado:", socket.id);
  invitados.push(socket);

  // Controles que vienen desde el creador
  socket.on("control", (data) => {
    if (data.accion === "ola") {
      console.log("🌊 Ola lanzada");
      let startAt = Date.now() + 1000;
      invitados.forEach((cli, i) => {
        cli.emit("ola", { delay: i * 500, startAt });
      });
    }

    if (data.accion === "todos") {
      console.log("💡 Encender todos");
      let startAt = Date.now() + 1000;
      invitados.forEach(cli => cli.emit("todos", { startAt }));
    }

    if (data.accion === "imagen") {
      console.log("🖼 Mostrar imagen");
      invitados.forEach(cli => cli.emit("imagen", data.data));
    }
  });

  socket.on("disconnect", () => {
    invitados = invitados.filter(c => c.id !== socket.id);
    console.log("❌ Cliente desconectado:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
