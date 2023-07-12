import {Config as storageConfig, CloudObjectStorageProvider as cloudObjectStorageProvider} from "./src/object-storage/clouds/index";
import {GCPObjectStorage} from "./src/object-storage/clouds/gcp/index"
import {GraphqlServerConfig, StartApolloStandaloneServer} from "./src/object-storage/server/index"

export { AuthContext } from "./src/object-storage/server";
export interface CloudObjectStorageProvider extends cloudObjectStorageProvider{}

export interface Config extends storageConfig, GraphqlServerConfig  {
    provider: string
    serverPort: number
}

const providers: {[key:string]: (config: Config) => CloudObjectStorageProvider } = {
    gcp: (config: Config) => {
        return new GCPObjectStorage 
    }
};

export interface Resolvers {
    withProvider(provider: CloudObjectStorageProvider): any
}


export async function StartServer(config: Config, typeDefs: any, resolverProvider: Resolvers) {
    const provider = providers[config.provider](config);
    await provider.init(config);

    return StartApolloStandaloneServer(config, typeDefs, resolverProvider.withProvider(provider));
}

