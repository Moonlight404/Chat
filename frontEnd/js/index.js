const socket = io('http://localhost:8080');

function generate_token(length){
    //edit the token allowed characters
    var a = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("");
    var b = [];  
    for (var i=0; i<length; i++) {
        var j = (Math.random() * (a.length-1)).toFixed(0);
        b[i] = a[j];
    }
    return b.join("");
}

function joinRoom(){
    socket.emit('register', generate_token(32));  
}   

function sendMessage(room, message){
    socket.emit('message', {'room': room, 'msg': message})
}

socket.on('message', function(msg) {
    const found = app.members.find(e => e.token == msg.me)
    if(found){
        const id = app.members.indexOf(found)
        app.members[id].msgs.push(msg)
        if(app.members[id].ultimaMensagemLida < app.members[id].msgs.length){
            app.members[id].notification++
            app.members[id].ultimaMensagemLida = app.members[id].msgs.length
        }
    }
})
socket.on('connect', function(){
    socket.emit("myToken", true)
    socket.emit('getServerMember', true)
    socket.emit('connectServer', app.me.token)
    socket.emit('connectServer', 'server')
})

socket.on('token', function(token){
    app.me.token = token
    localStorage.setItem("token", token)
    if(localStorage.getItem("nickname")){
        console.log(app.me.token)
        socket.emit('changeNickName', {"people": app.me.token, "nickname": localStorage.getItem("nickname")})
        app.me.nome = localStorage.getItem("nickname")
    }
})

socket.on('members', function(data){
    app.members = data
    var novoArrayMembros = []
    app.membrosAtivos = []
    if(app.members.find(e=> e.token == app.chating.token)){
            if(app.chating.token == data[i].token){
                app.chating.nome = data[i].nome
            }
        }
    app.membrosAtivos = novoArrayMembros
    for(let i = 0; i < app.members.length; i++){
        if(app.members[i].token !== app.me.token){
            novoArrayMembros.push(app.members[i])
        }
    }
})

function getAllMembers(){
    socket.emit('getServerMember', true)
}

const app = new Vue({
    el: "#app",
    data: {
        defaultAvatar: "img/avatar.png",
        colorsPeopleStatus: [
            {
                "status": "Online",
                "colorBorder": "green" 
            },
            {
                "status": "Ocupado",
                "colorBorder": "red" 
            },
            {
                "status": "Offline",
                "colorBorder": "white" 
            }
        ],
        alterStatus: false,
        me: {
            "token": null,
            "status": "Online"
        },
        members: [],
        msgs: [],
        chating: {},
        messageText: "",
        nickName: "",
        membrosAtivos: []
    },
    methods: {
        showMyStatus(){
            if(this.alterStatus)
                this.alterStatus = false
            else
                this.alterStatus = true
        },
        changeStatus(status){
            this.me.status = status
            socket.emit('changeStatus', {'token': this.me.token, 'status': status})
        },
        chatingWith(member){
            this.chating = member
            const found = this.members.find(e => e.token == member.token)
            if(found){
                const id = this.members.indexOf(found)
                this.members[id].notification = 0
            }
        },
        sendMessage(){
            if(this.chating.token)
                socket.emit('sendMessage', {"people": this.chating.token, "me": this.me.token, "msg": this.messageText})
                const foundMe = app.members.find(e => e.token == this.chating.token)
                const idMe = app.members.indexOf(foundMe)
                if(foundMe){
                    app.members[idMe].msgs.push({"people": this.chating.token, "me": this.me.token, "msg": this.messageText})
                }
                this.messageText = ""
        },
        saveNick(){
            if(this.nickName.length > 0){
                socket.emit('changeNickName', {"people": this.chating.token, "nickname": this.nickName})
                this.me.nome = this.nickName
                localStorage.setItem("nickname", this.nickName)
            }
        }
    }
})