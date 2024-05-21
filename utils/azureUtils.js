"use strict";

const { execSync } = require('child_process');
const { EventGridPublisherClient, AzureKeyCredential } = require("@azure/eventgrid");
const appConfig = require('../config/app-config');
const Cryptography = require('./cryptoGraphy');
const util = require('./util');

// Configuration for Event Grid
const eventGridConfig = {
    resourceGroupName: 'your-resource-group',
    topicName: 'your-topic-name',
    location: 'your-location',
    eventSubscriptionName: 'your-subscription-name',
    functionEndpoint: 'https://your-function-app.azurewebsites.net/runtime/webhooks/EventGrid?code=your-function-key',
    endpoint: 'https://<your-event-grid-topic-name>.<region>-1.eventgrid.azure.net/api/events',
    accessKey: 'your_event_grid_access_key'
};

function getToken(auth, callback) {
    var authentication = {};
    if (typeof auth.auth === "string") {
        var cryptConfig = appConfig.cryptSetting;
        var cryptography = new Cryptography(cryptConfig.algorithm, cryptConfig.password);
        authentication = JSON.parse(cryptography.decryptText(auth.auth, cryptConfig.decryptionEncoding, cryptConfig.encryptionEncoding));
    } else {
        authentication = auth.auth;
    }
    var url = "https://login.microsoftonline.com/" + authentication.tenantId + "/oauth2/token";
    var postData = {
        grant_type: authentication.grantType,
        client_id: authentication.clientId,
        client_secret: authentication.clientSecret,
        resource: authentication.resource
    };
    util.apiCall(url, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        formData: postData
    }, 'post', function (err, res) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, res.access_token);
        }
    });
}

// Create Resource Group
function createResourceGroup(resourceGroupName, location) {
    console.log(`Creating resource group: ${resourceGroupName} in ${location}`);
    execSync(`az group create --name ${resourceGroupName} --location ${location}`, { stdio: 'inherit' });
}

// Create Event Grid Topic
function createEventGridTopic(resourceGroupName, topicName, location) {
    console.log(`Creating Event Grid Topic: ${topicName} in ${location}`);
    execSync(`az eventgrid topic create --name ${topicName} --resource-group ${resourceGroupName} --location ${location}`, { stdio: 'inherit' });

    const topicEndpoint = execSync(`az eventgrid topic show --name ${topicName} --resource-group ${resourceGroupName} --query "endpoint" --output tsv`).toString().trim();
    const topicKey = execSync(`az eventgrid topic key list --name ${topicName} --resource-group ${resourceGroupName} --query "key1" --output tsv`).toString().trim();

    console.log(`Topic Endpoint: ${topicEndpoint}`);
    console.log(`Topic Key: ${topicKey}`);
    
    return { topicEndpoint, topicKey };
}

// Create Event Subscription
function createEventSubscription(resourceGroupName, topicName, eventSubscriptionName, functionEndpoint) {
    console.log(`Creating Event Subscription: ${eventSubscriptionName}`);
    execSync(`az eventgrid event-subscription create --name ${eventSubscriptionName} --source-resource-id /subscriptions/{subscription-id}/resourceGroups/${resourceGroupName}/providers/Microsoft.EventGrid/topics/${topicName} --endpoint ${functionEndpoint}`, { stdio: 'inherit' });
    console.log(`Event Subscription ${eventSubscriptionName} created successfully`);
}

// Send Event
async function sendEvent(eventData) {
    const client = new EventGridPublisherClient(eventGridConfig.endpoint, new AzureKeyCredential(eventGridConfig.accessKey));

    const events = [
        {
            eventType: "Contoso.Items.ItemReceived",
            subject: "New item received",
            dataVersion: "1.0",
            eventTime: new Date(),
            id: eventData.eventId,
            data: eventData,
        },
    ];

    try {
        await client.send(events);
        console.log("Event sent successfully");
    } catch (error) {
        console.error("Error sending event: ", error);
    }
}

module.exports = {
    getAzureToken: getToken,
    createResourceGroup,
    createEventGridTopic,
    createEventSubscription,
    sendEvent
};

