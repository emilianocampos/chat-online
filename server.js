const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Ruta para servir archivos estáticos desde "public"
app.use(express.static('public'));

// Ruta para obtener el historial de mensajes
app.get('/chat-history', (req, res) => {
  const filePath = path.join(__dirname, 'DB.json');
  
  // Leer los mensajes guardados en el archivo DB.json
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Error al leer el historial de chat.');
    }

    const chatHistory = JSON.parse(data);
    res.json(chatHistory);  // Enviar el historial como respuesta
  });
});

// Manejo de las conexiones de socket
io.on('connection', (socket) => {
  console.log('🟢 Nuevo usuario conectado');

  // Enviar el historial de chat al usuario cuando se conecta
  const filePath = path.join(__dirname, 'DB.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.log('Error al leer historial al conectar', err);
    } else {
      const chatHistory = JSON.parse(data);
      socket.emit('chat history', chatHistory);
    }
  });

  // Recibir mensajes de chat
  socket.on('chat message', (msg) => {
    // Leer el historial de mensajes
    const filePath = path.join(__dirname, 'DB.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
      let chatHistory = [];

      if (err) {
        console.log('No se pudo leer el archivo, creando uno nuevo');
      } else {
        chatHistory = JSON.parse(data);
      }

      // Agregar el nuevo mensaje al historial
      chatHistory.push({ message: msg, timestamp: new Date() });

      // Guardar el historial actualizado en el archivo DB.json
      fs.writeFile(filePath, JSON.stringify(chatHistory, null, 2), (err) => {
        if (err) {
          console.log('Error al guardar el mensaje en DB.json:', err);
        }
      });

      // Enviar el mensaje a todos los usuarios conectados
      io.emit('chat message', msg);
    });
  });

  // Cuando el usuario se desconecta
  socket.on('disconnect', () => {
    console.log('🔴 Usuario desconectado');
  });
});

server.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});