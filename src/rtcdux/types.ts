export type LocalMedia = {
  readonly mediaId: string;
  readonly name: string;
  readonly sfuConnectionId: string;
}

export type RemoteMedia = {
  readonly mediaId: string;
  readonly name: string;
  readonly remoteClientId: string;
  readonly sfuConnectionId: string; 
}

export type Sfu = {
  readonly connectionId: string;
  readonly status: string;
  readonly mediaId: string;
}
