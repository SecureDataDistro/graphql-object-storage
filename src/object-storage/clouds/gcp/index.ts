import {Storage, GetFilesResponse} from '@google-cloud/storage';
import {Config, CloudObjectStorageProvider} from "../index"


export class GCPObjectStorage implements CloudObjectStorageProvider {
    data: any[] = [];
    storage: Storage | undefined;
    config: Config | undefined;
    constructor(){}

    async init(config: Config): Promise<any> {
      this.storage = new Storage({
        projectId: config.workspaceId,
      });

      this.config = config;

      await this.refresh();
      
      console.log("init done");

      return true;
    }

    async refresh(): Promise<any[]> {
      if (this.storage == undefined) {
        throw new Error("Init routine was not ran");
      }

      if (this.config == undefined) {
        throw new Error("Config cannot be undefined");
      }

      const bucket = await this.storage.bucket(this.config.bucketName);

      const [files] : GetFilesResponse  = await bucket.getFiles({
        prefix: this.config.folder,
        matchGlob: this.config.glob
      });

      let newData: any[] = [];
      for (const file of files) {
        console.log(file.name);
        const content = await file.download();
        //console.log(content);
        //console.log(JSON.parse(String(content)));
        newData.push(JSON.parse(String(content)));
      }

      this.data = newData;
      
      console.log("refresh done");

      return Promise.resolve(this.data);
    }
}