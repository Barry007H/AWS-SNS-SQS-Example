const AWS = require('aws-sdk');
const proxy = require('proxy-agent');

AWS.config.update({region: 'us-east-1',
  httpOptions: {
    agent: proxy('http://iss-emea-pitc-londonz.proxy.corporate.gtm.ge.com:80')
  }
});


