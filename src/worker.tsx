console.log("Background worker starting");

function sendMessage(msg: any): void {
  // @ts-ignore
  self.postMessage(msg);
}

onmessage = e => {
  console.log("Worker received: ", e);
  sendMessage("response");
};
