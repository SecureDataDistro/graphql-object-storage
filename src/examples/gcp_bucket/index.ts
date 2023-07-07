import {Config, StartServer, Resolvers} from "../../../index"
import {gql} from "graphql-tag";
import { CloudObjectStorageProvider } from "../../object-storage/clouds";

const config: Config = {
    provider: "gcp",
    serverPort: 4000,
    workspaceId: "rare-nectar-390503",
    cacheTTL: 5 * 60, // 5 min
    bucketName: "demo-data-tapioca",
    folder: "earthquake/",
    glob: "earthquake/*.json"
}

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

class eqResolver implements Resolvers {
    constructor(){}

    withProvider(provider: CloudObjectStorageProvider) {
        return {
            Query: {
                Earthquakes: async () => {
                    console.log("querying for earthquakes");
                    const refreshedData = await provider.refresh()
                    //console.log(refreshedData);
                    return refreshedData;
                }
            }
        }
    }
}


export async function Start() {
    const resolvers = new eqResolver();
    await StartServer(config, schema, resolvers);
}