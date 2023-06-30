import {Config as storageConfig, CloudObjectStorageProvider} from "./src/object-storage/clouds/index";
import {GCPObjectStorage} from "./src/object-storage/clouds/gcp/index"

import {GraphqlServerConfig, StartApolloStandaloneServer} from "./src/object-storage/server/index"

export interface Config extends storageConfig, GraphqlServerConfig  {
    provider: string
    serverPort: number
}

const providers: {[key:string]: (config: Config) => GCPObjectStorage } = {
    gcp: (config: Config) => {
        return new GCPObjectStorage 
    }
}

export async function StartServer(config: Config, typeDefs: any, resolvers: any) {
    const provider = providers[config.provider](config);

    return StartApolloStandaloneServer(config, typeDefs, resolvers);
}

