// Finds a real, freely-licensed photo for each of several short search
// phrases, using Openverse (openverse.org) — a free, keyless search engine
// over Creative Commons / public domain images. No API key required.
export async function fetchImages(queries) {
  const safeQueries = (queries || []).slice(0, 8);

  return Promise.all(
    safeQueries.map(async (query) => {
      try {
        const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(
          query
        )}&page_size=1&mature=false`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Openverse responded ${res.status}`);
        const data = await res.json();
        const top = data.results?.[0];

        return {
          query,
          imageUrl: top?.thumbnail || top?.url || null,
          credit: top ? top.creator || "Unknown" : null,
        };
      } catch {
        return { query, imageUrl: null, credit: null };
      }
    })
  );
}
