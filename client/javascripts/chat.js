var name;

main = function () {
    'use strict';
    console.log("haloo")
    $("#nicknameButton").click(function () {
        name = $("#nickname").val()
        console.log(name);
        if (name !== "") {
            console.log(name);
            document.location = "http://localhost:3000/index2.html";
            console.log(document.location);
        }
    });
    if(name !== "") {
        getMessageBox();
    }
}

getMessages = function () {
    $("#messages").empty();
    $.getJSON("messages.json", function (foundMessages) {
        console.log(foundMessages);
        var allMessages = foundMessages.map(function (foundMessage) {
            return foundMessage.nickName + ": " + foundMessage.message;
        });
        allMessages.forEach(function (nickName) {
            var feed = nickName;
            $("#messages").append("<div>" + feed);
        });
    });
}

getMessageBox = function () {
    $("#inputMessage").append("<input type='text' id='send'><br>");
    $("#inputMessage").append("<button href='index2.html' type='button' id='sendButton'>send</button>");
    $("#sendButton").click(function () {
        newMessage = $("#send").val();
        console.log(newMessage);
        if (newMessage !== "") {
            messageObject = { "nickName": name, "message": newMessage };
            $.post("messages", messageObject)
            getMessages();
        }
    })

}

$(document).ready(main)