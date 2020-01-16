'use strict';

const socket = new WebSocket('wss://pubsub-edge.twitch.tv:443');
const client_id = 'nxyyskr9bnxcy08abnfnhrmxvqtjht';
const api_url = 'https://api.twitch.tv/helix';

var user;
var app_token;
var debug_output = document.getElementById('debug');
var channel_name;


if (document.location.hash) {
    document.getElementById('landing').classList.add('d-none');

    // Getting the OAuth token
    var search = /=([a-z0-9]+)&/;
    var url_fragment = document.location.hash;
    app_token = url_fragment.match(search)[1];
    console.debug('App token:', app_token);

    getUserID();
    pubsub();
} else {
    document.getElementById('connect').setAttribute('href', document.getElementById('connect').getAttribute('href').replace('<url>', document.location.href));
    console.log(document.location.href);
    console.info('Please login to continue.')
}

// Retrieving the User ID
function getUserID() {
    var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = () => {
        if (httpRequest.readyState === XMLHttpRequest.DONE) {
            if (httpRequest.status === 200) {
                user = JSON.parse(httpRequest.response).data[0];
                console.debug(user);
                debug_output.append('User ID: '+ user.id +'\n');
                return user;
            }
        }
    };
    httpRequest.open('GET', api_url +'/users', true);
    httpRequest.setRequestHeader('Authorization', 'Bearer '+ app_token);
    httpRequest.send();
}

function pubsub() {
    // PING the server every 5 minutes
    var ping = window.setInterval(() => {
        console.log('Sending PING to the server...');
        socket.send(JSON.stringify({"type": "PING"}));
    }, 300000);

    // Managing server returns
    socket.onmessage = (message) => {
        const response = JSON.parse(message.data);
        console.debug('Response message:', response);
        switch (response.type) {
            case 'RESPONSE':
                if (response.error) {
                    console.error('Server returned an error:', response.error);
                    socket.close();
                } else {
                    console.log('Server is OK!');
                }
                break;
            case 'MESSAGE':

                break;
            default:
                if (response.type == 'PONG') {
                    console.log('The server responded PONG to the request!');
                }
        }
    }
    socket.onopen = () => {
        console.time('Connection time');
        console.log('Connected!');
        socket.send(JSON.stringify({
            'type': 'LISTEN',
            'data': {
                'topics': ['channel-bits-events-v1.'+ user.id],
                'auth_token': app_token
            }
        }));
    }
    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
    }
    socket.onclose = () => {
        console.log('Connection is closed.');
        console.timeEnd('Connection time');
        window.clearInterval(ping);
    }
}
