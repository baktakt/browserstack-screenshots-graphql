
import { ApolloServer, gql } from 'apollo-server';
import { ApolloServer as ApolloServerLambda } from 'apollo-server-lambda';
import * as EnvironmentVariables from 'dotenv';
import * as BrowserStack from 'browserstack';

EnvironmentVariables.config({
  path: '.env'
});

const typeDefs = gql`
  type Query {
    browsers: [Browser]
    getScreenShot(url: String, browser: BrowserInput!): Job
  }

  input BrowserInput {
    name: String!
    version: String!
    osName: String!
    osVersion: String!
  }
  type Browser {
    os: String,
    osVersion: String,
    browser: String,
    browserVersion: String,
  }
  type Job {
    job_id: String!
  }
`;

const browserStackCredentials = {
  username: process.env.BROWSERSTACK_USERNAME,
  password: process.env.BROWSERSTACK_PASSWORD
};


const resolvers = {
  Query: {
    async getScreenShot(obj, { url, browser }, context, info) {
      console.log(browser);
      let screenshots:any = await takeScreenShot(url, browser);
      return { job_id: screenshots.job_id }
    }
  }
};

async function takeScreenShot(url, browser) {
  var options = {
    url: url,
    callback_url: 'https://call.this.url',
    browsers: [
      {
        os: browser.osName,
        os_version: browser.osVersion,
        browser: browser.name,
        browser_version: browser.version
      },
    ]
  };
  var screenshotClient = BrowserStack.createScreenshotClient(browserStackCredentials);
  return new Promise((resolve, reject) => {
    screenshotClient.generateScreenshots(options, function (error, job) {
      if (error) {
        console.log('ERROR', error);
        return reject(error);
      }
      resolve(job);
    });
  });
}


function createLambdaServer() {
  return new ApolloServerLambda({
    typeDefs: typeDefs,
    resolvers,
    introspection: true,
    playground: true,
  });
}

function createLocalServer() {
  return new ApolloServer({
    typeDefs: typeDefs,
    resolvers,
    introspection: true,
    playground: true,
  });
}

export { createLambdaServer, createLocalServer }