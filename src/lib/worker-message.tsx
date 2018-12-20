export const LIST_DIR = 0;

export interface ListDirMessage {
  messageType: number;
  path: string;
}

export function listDirMessage(path: string): ListDirMessage {
  return {
    messageType: LIST_DIR,
    path: path
  };
}
