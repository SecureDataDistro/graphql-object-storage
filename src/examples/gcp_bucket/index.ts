import {Config, StartServer, Resolvers} from "../../../index"
import {gql} from "graphql-tag";
import { CloudObjectStorageProvider } from "../../object-storage/clouds";
import { Command } from 'commander';
import { GraphQLError } from 'graphql';
import { Authorizer } from "@hub/iam";
import { AuthContext } from "../../../src/object-storage/server"

const schema = gql`
    type Query {
        Earthquakes: [EarthquakeEvent] 
    }

    type EarthquakeSensorEvent {
        WGS84_Lon: Float
        WGS84_Lat: Float
        PGA: Float
        PGV: Float
        Intensity: Float
    }

    type EarthquakeEvent {
        EventName: String
        EventDateTime: String
        Magnitude: Float
        EQ_WGS84_Lon: Float
        EQ_WGS84_Lat: Float
        Depth: Float
        Data: [EarthquakeSensorEvent]
    }
`



export async function Start() {
    const program = new Command();

    program
    .description("Object Storage GraphQL Service")
    .requiredOption("--account <account id>", "account id for the cloud provider being used")
    .option("-P, --provider <provider>", "select an object store provider (gcp)", "gcp")
    .option("--ttl", "interval in seconds to refresh in-memory data from storage", "300")
    .requiredOption("-b, --bucket <bucket name>", "name of the bucket to read from")
    .requiredOption("-f, --folder <bucket folder path>", "bucket folder path to read from", undefined)
    .requiredOption("-g, --glob <file glob pattern>", "glob pattern to use to restrict read files (if supported by provider)", undefined)
    .requiredOption("--urn <long or short hand resource URN>", "resource URN (as defined in IAM docs) for repository")
    .requiredOption("--endpoint <endpoint url>", "http(s) endpoint to get public jet key from such as http://localhost:3000/pub")
    .action(async (opts) => {

        const config: Config = {
            provider: opts.provider,
            serverPort: 4000,
            workspaceId: opts.account,
            cacheTTL: Number(opts.ttl),
            bucketName: opts.bucket,
            folder: opts.folder,
            glob: opts.glob,
            resourceURN: opts.urn,
            publicKeyEndpoint: opts.endpoint
        }

        const auth = new Authorizer(config.publicKeyEndpoint);

        class eqResolver implements Resolvers {
            constructor(){}
        
            withProvider(provider: CloudObjectStorageProvider) {
                return {
                    Query: {
                        Earthquakes: async (_,__,contextValue: AuthContext) => {
                            const allowed = await auth.isAuthorized(contextValue.jwt!, [config.resourceURN]);
        
                            if (!allowed) {
                                throw new GraphQLError('Not authorized to access URN', {
                                    extensions: {
                                    code: 'FORBIDDEN',
                                    http: { status: 403 },
                                    },
                                });
                            }
        
                            console.log("querying for earthquakes");
                            const refreshedData = await provider.refresh()
                            //console.log(refreshedData);
                            return refreshedData;
                        }
                    }
                }
            }
        }

        const resolvers = new eqResolver();
        await StartServer(config, schema, resolvers);
    });

    

    program.parse(process.argv.slice(2));
}