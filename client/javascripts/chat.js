var name = "";

main = function () {
    'use strict';
    console.log("haloo")
    getUserInterface();
}

getUserInterface = function () {
    if (name === "") {
        $(".inputName").append("<input type='text' id='nickname'><br>");
        $(".inputName").append("<button type='button' id='nicknameButton'>ready</button>");
        $("#nicknameButton").click(function () {
            name = $("#nickname").val();
            console.log(name);
        });
    }
    getMessages();
    getMessageBox();
}

getMessages = function () {
    $(".messages").empty();
    $.getJSON("messages.json", function (foundMessages) {
        console.log(foundMessages);
        var allMessages = foundMessages.map(function (foundMessage) {
            return foundMessage.nickName + ": " + foundMessage.message;
        });
        allMessages.forEach(function (nickName) {
            var feed = nickName;
            $(".messages").append("<div>" + feed);
        });
    });
}

getMessageBox = function () {
    $(".inputMessage").append("<input type='text' id='send'><br>");
    $(".inputMessage").append("<button type='button' id='sendButton'>send</button>");
    $("#sendButton").click(function () {
        if (name !== "") {
            newMessage = $("#send").val();
            console.log(newMessage);
            if (newMessage !== "") {
                messageObject = { "nickName": name, "message": newMessage };
                $.post("messages", messageObject)
                getMessages();
            }
        }

    })

}

$(document).ready(main)