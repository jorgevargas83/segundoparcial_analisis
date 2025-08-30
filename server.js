const io = require("socket.io")(3000, {
  cors: { origin: "*" }
});

// Listas de invitados
let invitados = [];
let invitadosDetectados = [];

io.on("connection", (socket) => {
  console.log("🔌 Conectado:", socket.id);
  invitados.push(socket);

  // 👉 Cuando el creador detecta un teléfono con la cámara
  socket.on("telefonoDetectado", () => {
    console.log("📱 Teléfono detectado por la cámara");
    // ⚠️ Por ahora apagamos a todos los invitados que parpadean
    invitados.forEach(cli => cli.emit("detectar"));
    // Ahora todos los invitados se marcan como detectados (activos)
    invitadosDetectados = [...invitados];
    console.log(`✅ Invitados detectados: ${invitadosDetectados.length}`);
  });

  // 👉 Control manual desde los botones del creador
  socket.on("control", (data) => {
    if (data.accion === "ola") {
      console.log("🌊 Ola lanzada");
      invitadosDetectados.forEach((cli, i) => {
        cli.emit("ola", { delay: i * 500 });
      });
    }

    if (data.accion === "todos") {
      console.log("💡 Encender todos");
      invitadosDetectados.forEach(cli => cli.emit("todos"));
    }
  });

  // 👉 Cuando un invitado se desconecta
  socket.on("disconnect", () => {
    console.log("❌ Desconectado:", socket.id);
    invitados = invitados.filter(c => c.id !== socket.id);
    invitadosDetectados = invitadosDetectados.filter(c => c.id !== socket.id);
    console.log(`👥 Conectados: ${invitados.length}, Activos: ${invitadosDetectados.length}`);
  });
});
