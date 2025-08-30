const io = require("socket.io")(3000, {
  cors: { origin: "*" }
});

let invitados = [];

io.on("connection", (socket) => {
  console.log("✅ Nuevo invitado:", socket.id);
  invitados.push(socket);

  socket.on("control", (data) => {
    if (data.accion === "ola") {
      console.log("🌊 Ola lanzada");
      let startAt = Date.now() + 1000; // empieza en 1s
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
    console.log("❌ Invitado desconectado:", socket.id);
  });
});
