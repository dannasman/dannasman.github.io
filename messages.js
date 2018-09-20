var mongoose = require("mongoose");

var messageSchema = mongoose.Schema({
    nickName: String,
    message: String
})

var MessageModel = mongoose.model("MessageModel", messageSchema )

module.exports = MessageModel;