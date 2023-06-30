import {Storage} from '@google-cloud/storage';
import {Config, CloudObjectStorageProvider} from "../index"


async function authenticateImplicitWithAdc(config: Config) {
    // This snippet demonstrates how to list buckets.
    // NOTE: Replace the client created below with the client required for your application.
    // Note that the credentials are not specified when constructing the client.
    // The client library finds your credentials using ADC.
    const storage = new Storage({
      projectId: config.workspaceId,
    });
    const [buckets] = await storage.getBuckets({
        prefix: config.bucketName
    });
    console.log('Buckets:');
  
    for (const bucket of buckets) {
      console.log(`- ${bucket.name}`);
    }
  
    console.log('Listed all storage buckets.');
  }
  
  //authenticateImplicitWithAdc();

export class GCPObjectStorage implements CloudObjectStorageProvider {
    data = ["test"];
    constructor(){}

    async init(config: Config): Promise<any> {
        await authenticateImplicitWithAdc(config);
        return true;
    }

    refresh(): Promise<any> {
        return Promise.resolve(this.data);
    }
}