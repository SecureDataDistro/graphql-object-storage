import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from '@apollo/server/standalone';


export interface GraphqlServerConfig {
    serverPort: number
}


export async function StartApolloStandaloneServer(config: GraphqlServerConfig, typeDefs: any, resolvers: any) {
    const server = new ApolloServer({
        //schema: buildSubgraphSchema({ typeDefs, resolvers }),
        typeDefs,
        resolvers
    });
    
    // Passing an ApolloServer instance to the `startStandaloneServer` function:
    //  1. creates an Express app
    //  2. installs your ApolloServer instance as middleware
    //  3. prepares your app to handle incoming requests
    const { url } = await startStandaloneServer(server, {
        listen: { port: config.serverPort },
    });
    
}