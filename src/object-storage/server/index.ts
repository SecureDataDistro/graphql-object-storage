import { ApolloServer, BaseContext } from "@apollo/server";
import { startStandaloneServer } from '@apollo/server/standalone';
import { GraphQLError } from 'graphql';
import {JWT} from "@hub/jwt"
import { Authorizer } from "@hub/iam";

export interface GraphqlServerConfig {
    serverPort: number
    publicKeyEndpoint: string
    resourceURN: string
}

export interface AuthContext extends BaseContext {
    jwt: JWT
}

export async function StartApolloStandaloneServer(config: GraphqlServerConfig, typeDefs: any, resolvers: any) {
    
    
    const server = new ApolloServer<AuthContext>({
        //schema: buildSubgraphSchema({ typeDefs, resolvers }),
        typeDefs,
        resolvers
    });

    const auth = new Authorizer(config.publicKeyEndpoint);
    
    // Passing an ApolloServer instance to the `startStandaloneServer` function:
    //  1. creates an Express app
    //  2. installs your ApolloServer instance as middleware
    //  3. prepares your app to handle incoming requests
    const { url } = await startStandaloneServer(server, {
        listen: { port: config.serverPort },
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
          },
    });
    
}