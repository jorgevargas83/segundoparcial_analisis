const io = require("socket.io")(3000, {
  cors: { origin: "*" }
});

let invitados = [];
let invitadosDetectados = [];

io.on("connection", (socket) => {
  console.log("🔌 Conectado:", socket.id);
  invitados.push(socket);

  // Acciones que puede mandar el creador
  socket.on("control", (data) => {
    if (data.accion === "detectar") {
      console.log("📡 Detectando invitados...");
      invitados.forEach(cli => {
        cli.emit("detectar");
        if (!invitadosDetectados.includes(cli)) {
          invitadosDetectados.push(cli);
        }
      });
      console.log(`✅ Invitados detectados: ${invitadosDetectados.length}`);
    }

    if (data.accion === "ola") {
      console.log("🌊 Lanzando ola...");
      invitadosDetectados.forEach((cli, i) => {
        cli.emit("ola", { delay: i * 500 });
      });
    }

    if (data.accion === "todos") {
      console.log("💡 Encendiendo todos...");
      invitadosDetectados.forEach(cli => cli.emit("todos"));
    }
  });

  // Cuando un invitado se desconecta
  socket.on("disconnect", () => {
    console.log("❌ Desconectado:", socket.id);
    invitados = invitados.filter(c => c.id !== socket.id);
    invitadosDetectados = invitadosDetectados.filter(c => c.id !== socket.id);
    console.log(`👥 Conectados: ${invitados.length}, Activos: ${invitadosDetectados.length}`);
  });
});

