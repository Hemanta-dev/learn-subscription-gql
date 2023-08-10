import express from "express";
import { createServer } from "http";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { SubscriptionServer } from "subscriptions-transport-ws";
import { execute, subscribe } from "graphql";
import { ApolloServer } from "apollo-server-express";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import connectToDatabase from "./model/DB.js";
import typeDefs from "./typeDefs.js";
import resolvers from "./resolvers.js";

(async function () {
  const app = express();
  const httpServer = createServer(app);

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  const subscriptionServerInstance = SubscriptionServer.create(
    { schema, execute, subscribe },
    { server: httpServer, path: "/graphql" }
  );

  const server = new ApolloServer({
    schema,
    plugins: [
      {
        async serverWillStart() {
          return {
            async drainServer() {
              subscriptionServerInstance.close();
            },
          };
        },
      },
      ApolloServerPluginLandingPageGraphQLPlayground() 
    ],

  });

  // Connection
  connectToDatabase();

  await server.start();

  // Use applyMiddleware directly on the ApolloServer instance
  server.applyMiddleware({ app });

  const PORT = 5000;
  httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
})();
