const electron = require("electron");

import { LIST_DIR } from "./lib/worker-message";
import { listDir } from "./lib/fs";

console.log("Background worker starting");

electron.ipcRenderer.on("channel", (event: any, msg: any) => {
  console.log("WORKER GOT", event, msg);
});

// function sendMessage(msg: any): void {
//   // @ts-ignore
//   self.postMessage(msg);
// }

// onmessage = e => {
//   console.log("Worker received: ", e);

//   if (e.data.messageType === LIST_DIR) {
//     list(e.data.path).then(
//       success => {
//         sendMessage(`Successfully listed ${e.data.path}`);
//       },
//       err => {
//         sendMessage(`ERROR: ${err}`);
//       }
//     );
//   }
// };

// async function list(path: string) {
//   const contents = await listDir(path);
// }
