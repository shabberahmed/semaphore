const request = require('request');

const apiEndpoint = 'http://localhost:8080/book/661b9effda1c8101bf9eb49f';
const numberOfRequests = 100;
const requestBody = { "tickets": 2 };

// Function to make a single request with a body
function makeRequest(callback) {
    request.post({
        url: apiEndpoint,
        json: true,
        body: requestBody
    }, (error, response, body) => {
        if (error) {
            // Handle error
            callback(error);
        } else {
            // Handle response
            callback(null, body);
        }
    });
}

// Array to hold the promises for making requests
const promises = [];

// Create promises to make requests
for (let i = 0; i < numberOfRequests; i++) {
    promises.push(new Promise((resolve, reject) => {
        makeRequest((error, data) => {
            if (error) {
                reject(error);
            } else {
                resolve(data);
            }
        });
    }));
}

// Execute all promises in parallel
Promise.all(promises)
    .then((results) => {
        console.log('All requests completed successfully.');
        console.log('Results:', results);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
