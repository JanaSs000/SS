const { WebSocketServer } = require("ws");

function initWSS(server) {
    const wss = new WebSocketServer({ server });

    //broadcast function
    wss.broadcast = function (data) {
        const msg = JSON.stringify(data);
        wss.clients.forEach(c => {
            if (c.readyState === 1) c.send(msg);
        });
    };

    return wss;
}

module.exports = { initWSS };
