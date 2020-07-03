const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios')

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.use(express.static(path.join(__dirname, 'frontEnd')));
var porta = process.env.PORT || 8080;

app.set('views', path.join(__dirname, 'frontEnd'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

const clientID = 'eb86cdfc63b6ac4d37bb'
const clientSecret = 'ca03317bd1cc4fbe56f4aeb893fb088c27f2d44d'

app.get('/', (req, res) => {
  res.render('index.html');
})  

let users = []
let servers = []

io.on('connection', socket => {
    socket.on('message', function (msg) {
        console.log(msg)
        const uidTo = msg.room 
        socket.in(uidTo).emit('chat message', msg.message )
    });
    socket.on('connectServer', function (uid) {
        socket.join(uid)
    });
    socket.on('myToken', function(token){
        if(users.find(e => e.token == socket.id)){
            return;
        } else{
            users.push({
                "nome": socket.id,
                "token": socket.id,
                "status": "Online",
                "foto": null,
                "insignias": [],
                "notification": 0,
                "ultimaMensagemLida": 0,
                "msgs": []
            })
        }
        socket.emit('token', socket.id)
        socket.in('server').emit('members', users)
    })
    socket.on('getServerMember', function(data){
        socket.emit('members', users)
    })
    socket.on('changeStatus', function(data){
        const foundUser = users.find(e => e.token == data.token)
        if(foundUser){
            const id = users.indexOf(foundUser)
            users[id].status = data.status
            socket.in('server').emit('members', users)
            socket.emit('members', users)
        }
    })
    socket.on('sendMessage', function(data){
        const foundUser = users.find(e => e.token == data.people)
        if(foundUser){
            socket.emit('messageMinha', data)
            socket.in(data.people).emit('message', data)
        }
    })
    socket.on('changeNickName', function(data){
        const foundUser = users.find(e => e.token == socket.id)
        if(foundUser){
            const id = users.indexOf(foundUser)
            users[id].nome = data.nickname
            socket.in('server').emit('members', users)
        }
    })
    socket.on('disconnect', function(data){
        const foundUser = users.find(e => e.token == socket.id)
        if(foundUser){
            const id = users.indexOf(foundUser)
            users.splice(id, 1)
            socket.in('server').emit('members', users)
        }
    })
 });

 server.listen(porta);