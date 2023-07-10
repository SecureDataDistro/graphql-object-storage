import { ApolloServer, BaseContext } from "@apollo/server";
import { startStandaloneServer } from '@apollo/server/standalone';
import { GraphQLError } from 'graphql';
import {JWT} from "@hub/jwt"
import { Authorizer } from "@hub/iam";

import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import { config } from "process";

export interface GraphqlServerConfig {
    serverPort: number
    publicKeyEndpoint: string
    resourceURN: string
}

export interface AuthContext extends BaseContext {
    jwt: JWT
}

export async function StartApolloStandaloneServer(config: GraphqlServerConfig, typeDefs: any, resolvers: any) {
    
    const app = express();
    const httpServer = http.createServer(app);
    
    const server = new ApolloServer<AuthContext>({
        //schema: buildSubgraphSchema({ typeDefs, resolvers }),
        typeDefs,
        resolvers,
        plugins: [ApolloServerPluginDrainHttpServer({ httpServer })]
    });

    await server.start();

    const auth = new Authorizer(config.publicKeyEndpoint);

    app.use(
      '/graphql',
      cors<cors.CorsRequest>(),
      // 50mb is the limit that `startStandaloneServer` uses, but you may configure this to suit your needs
      bodyParser.json({ limit: '50mb' }),
      // expressMiddleware accepts the same arguments:
      // an Apollo Server instance and optional configuration options
      expressMiddleware<AuthContext>(server, {
        context: async ({ req, res }) => {
            // Get the user token from the headers.
            const token: string = req.headers["x-hasura-token"] as string || '';
            
            if (token == '') {
                throw new GraphQLError('JWT is not present', {
                    extensions: {
                      code: 'UNAUTHENTICATED',
                      http: { status: 401 },
                    },
                  });
            }

            // Try to retrieve a user with the token
            const jwt = await auth.isVerified(token);

            if (!jwt) {
                throw new GraphQLError('JWT cannot be verified', {
                    extensions: {
                      code: 'UNAUTHENTICATED',
                      http: { status: 401 },
                    },
                  });
            }

            const allowed = await auth.isAuthorized(jwt, [config.resourceURN]);

            if (!allowed) {
                throw new GraphQLError('Not authorized to access URN', {
                    extensions: {
                      code: 'FORBIDDEN',
                      http: { status: 403 },
                    },
                  });
            }

        
            // Add the user to the context
            return { jwt };
          }
        }
      ),
    );

    app.get('/health', (req, res) => {
      res.status(200).send('ok');
    });
    
    // Modified server startup
    await new Promise<void>((resolve) => httpServer.listen({ port: config.serverPort }, resolve));
    console.log(`🚀 Server ready at http://localhost:4000/`);
}