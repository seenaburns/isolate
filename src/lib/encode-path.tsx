export default function encodePath(path: string): string {
  const uri = encodeURI(path);
  // Encode all ?
  return uri.replace(/\?/g, "%3F");
}
