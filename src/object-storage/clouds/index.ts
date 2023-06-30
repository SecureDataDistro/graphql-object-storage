export interface CloudObjectStorageProvider {
    init(config: Config): Promise<any>
    refresh(): Promise<any|undefined>
}

export interface Config {
    workspaceId: string
    cacheTTL: number // in seconds
    fileGlob: string
    bucketName: string
}