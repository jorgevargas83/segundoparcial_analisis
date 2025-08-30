const io = require("socket.io")(3000, {
  cors: { origin: "*" }
});

let invitados = [];

io.on("connection", (socket) => {
  console.log("Conectado:", socket.id);

  // Invitados se guardan
  invitados.push(socket);

  // Creador avisa que detectó un teléfono
  socket.on("telefonoDetectado", () => {
    console.log("📱 Teléfono detectado");
    // Le decimos al último invitado que deje de parpadear
    if (invitados.length > 0) {
      invitados[invitados.length - 1].emit("detectar");
    }
  });

  // Creador lanza ola
  socket.on("control", (data) => {
    if (data.accion === "ola") {
      console.log("🌊 Ola lanzada");
      invitados.forEach((cli, i) => {
        cli.emit("ola", { delay: i * 500 });
      });
    }
  });

  // Desconexión
  socket.on("disconnect", () => {
    invitados = invitados.filter(c => c.id !== socket.id);
  });
});
