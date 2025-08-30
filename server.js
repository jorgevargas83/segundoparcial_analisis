const io = require("socket.io")(3000, {
  cors: { origin: "*" }
});

let invitados = [];

io.on("connection", (socket) => {
  console.log("Conectado:", socket.id);

  invitados.push(socket);

  socket.on("control", (data) => {
    if (data.accion === "detectar") {
      console.log("📡 Invitados detectados");
      invitados.forEach(cli => cli.emit("detectar"));
    }

    if (data.accion === "ola") {
      console.log("🌊 Ola lanzada");
      invitados.forEach((cli, i) => {
        cli.emit("ola", { delay: i * 500 });
      });
    }

    if (data.accion === "todos") {
      console.log("💡 Encender todos");
      invitados.forEach(cli => cli.emit("todos"));
    }
  });

  socket.on("disconnect", () => {
    invitados = invitados.filter(c => c.id !== socket.id);
  });
});
