const AWS = require('aws-sdk');
const proxy = require('proxy-agent');

AWS.config.update({region: 'us-east-1',
  httpOptions: {
    agent: proxy('http://iss-emea-pitc-londonz.proxy.corporate.gtm.ge.com:80')
  }
});
const sns = new AWS.SNS({apiVersion: '2010-03-31'});
const sqs = new AWS.SQS({apiVersion: '2012-11-05'});
const cw = new AWS.CloudWatch({apiVersion: '2010-08-01'});

const queueURL = "https://sqs.us-east-1.amazonaws.com/048421397550/av-diag-rudr-SNS-filtered-queue-1";
const topicArn = "arn:aws:sns:us-east-1:048421397550:av-diag-rudr-SNS-filtering";
const messageData = require('./message.json');

var messageCount = 1;

const SNSparams = {
  Message: JSON.stringify(messageData),
  TopicArn: topicArn,
  MessageAttributes: {
    'ACARSUnidentified': {
      DataType: "String",
      StringValue: "UNIDENTIFIED"
    }
  }
};
const SQSparams = {
  QueueUrl: queueURL,  
  MaxNumberOfMessages: 1,
  VisibilityTimeout: 60
};

while (messageCount != 31) {
const SNSmetricParams = {
  MetricData: [
    {
      MetricName: 'SNS publish count',
      Dimensions: [
        {
          Name: 'SNSTopicCount',
          Value: 'Number of messages published'
        },
        {
          Name: 'av-diag-rudr-message-size',
          Value: 'Size of messages in bytes'
        }
      ],
      Values: [messageCount, 100, 200, 300, -10]
    }
  ],
  Namespace: 'AWS/SNS'
}
const SQSmetricParams = {
  MetricData: [
    {
      MetricName: 'SQS queue count',
      Dimensions: [
        {
          Name: 'SQSQueueCount',
          Value: 'Numbers of messages going through a queue'
        }
      ],
      Values: [messageCount]
    }
  ],
  Namespace: 'AWS/SQS'
}
  this.messageCount = messageCount++;
  //this.messageCount = messageCount++;
  sns.publish(SNSparams, function(err, data) {
    if (err) {
      console.log("Recieve Error", err);
    } else if (data) {
      console.log("Messages Published: ", data);
      SNSmetricData();
      sqsRecieverFunction();
    }
  });
  
  function sqsRecieverFunction() {
    sqs.receiveMessage(SQSparams, function(err, data) {
      if (err) {
        console.log("Recieve Error", err);
      } else if (data.Messages) {
        console.log("Message Recieved");
        const rawMessage = JSON.parse(data.Messages[0].Body).Message;
        const parsedMessage = JSON.parse(rawMessage);
        //console.log(parsedMessage);
        const deleteParams = {
          QueueUrl: queueURL,
          ReceiptHandle: data.Messages[0].ReceiptHandle
        };
        sqs.deleteMessage(deleteParams, function(err, data) {
          if (err) {
            console.log("Delete Error", err);
          } else {
            console.log("Message Deleted", data);
            SQSmetricData();
          }
        })
      }  
    })
  }
  function SNSmetricData() {
    cw.putMetricData(SNSmetricParams, function(err, data) {
      if (err) {
        console.log(err, err.stack);
      } else {
        console.log(data);
        messageCount++;
      }
    })
  }
  function SQSmetricData() {
    cw.putMetricData(SQSmetricParams, function(err, data) {
      if (err) {
        console.log(err, err.stack);
      } else {
        console.log(data);
      }
    })
  }
};