export default async function nonFatalAll<T>(
  name: string,
  ps: Promise<T>[]
): Promise<T[]> {
  const all = await Promise.all(
    ps.map(p =>
      p.then(
        x => x,
        err => {
          console.warn("Failed running", name, err);
          return null;
        }
      )
    )
  );
  return all.filter(x => x);
}
