const azureUtils = require('./utils/azureUtils');

// Configuration (You should replace these values with actual ones)
const config = {
    resourceGroupName: 'your-resource-group',
    topicName: 'your-topic-name',
    location: 'your-location',
    eventSubscriptionName: 'your-subscription-name',
    functionEndpoint: 'https://your-function-app.azurewebsites.net/runtime/webhooks/EventGrid?code=your-function-key'
};

// Create Resource Group
azureUtils.createResourceGroup(config.resourceGroupName, config.location);

// Create Event Grid Topic
const { topicEndpoint, topicKey } = azureUtils.createEventGridTopic(config.resourceGroupName, config.topicName, config.location);

// Create Event Subscription
azureUtils.createEventSubscription(config.resourceGroupName, config.topicName, config.eventSubscriptionName, config.functionEndpoint);

// Send Event
const eventData = {
    eventId: "12345",
    eventType: "Contoso.Items.ItemReceived",
    subject: "New item received",
    data: { message: "Hello, World!" },
    eventTime: new Date(),
    createdBy: "Admin"
};

azureUtils.sendEvent(eventData);
