export default function encodePath(path: string): string {
  const uri = encodeURI(path);
  // Encode all ?, #
  // Unencode backslashes for windows paths
  return uri
    .replace(/\?/g, "%3F")
    .replace(/\#/g, "%23")
    .replace(/%5C/g, "\\");
}
