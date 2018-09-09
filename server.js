var express = require("express"),
    http = require("http"),
    mongoose = require("mongoose"),
    bodyParser = require("body-parser"),
    nconf = require("nconf"),
    app = express();

app.use(express.static(__dirname + "/client"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

nconf.argv().env().file("keys.json");

const user = nconf.get("mongoUser");
const pass = nconf.get("mongoPass");
const host = nconf.get("mongoHost");
const port = nconf.get("mongoPort");
const database = nconf.get("mongoDatabase")

let uri = `mongodb://${user}:${pass}@${host}:${port}/${database}`;

mongoose.connect(uri, { useNewUrlParser: true });

var messageSchema = mongoose.Schema({
    nickName: String,
    message: String
})

var MessageModel = mongoose.model("MessageModel", messageSchema )

http.createServer(app).listen(3000);

app.get("/messages.json", function(req, res)    {
    MessageModel.find({}, function(err, foundMessages)  {
        res.json(foundMessages);
    })
})

app.post("/messages", function(req, res)  {
    var newMessage = new MessageModel({
        "nickName": req.body.nickName,
        "message": req.body.message
    });
    newMessage.save(function(err, result)   {
        if(err !== null)    {
            console.log(err);
            res.send("ERROR");
        }
        else {
            MessageModel.find({}, function (err, result) {
                if (err !== null) {
                    res.send("ERROR");
                }
                res.json(result);
            });
        }
    });
})

console.log("servu päällä --> portti 3000")