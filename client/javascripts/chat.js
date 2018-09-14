var name;
var messageArrayLength = 0;

main = function () {
    'use strict';
    checkUser();
}

getMessages = function () {
    $("#messages").empty();
    $.getJSON("messages.json", function (foundMessages) {
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
        if (newMessage !== "") {
            messageObject = { "nickName": name, "message": newMessage };
            $.post("messages", messageObject);
        }
    })

}

checkUser = function ()   {
    $("#nicknameButton").click(function () {
        name = $("#nickname").val()
        if (name !== "") {
            document.location = "http://localhost:3000/index2.html";
        }
    });
    if(name !== "") {
        getMessageBox();
        setInterval(function()   {
            checkNewMessages();
        }, 1000);
    }
}

checkNewMessages = function ()  {
    $.getJSON("messages.json", function (foundMessages) {
        var result = 0;
        for(i in foundMessages) {
            result++;
        }
        if(result > messageArrayLength) {
            messageArrayLength = result;
            getMessages();
        }

    });
        
};

$(document).ready(main)