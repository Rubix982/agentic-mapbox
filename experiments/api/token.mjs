// What does the Tokens API say about this account's public token, and which of the account's read-only listing
// endpoints (styles, tilesets, datasets, tokens) will answer it?
//
// Everything here is a GET: nothing on the account is created, changed or deleted. The account name is needed for
// the listing URLs; it is replaced by <user> before anything is written.
import { apiExperiment, fact } from '../lib.mjs';

await apiExperiment({
  file: import.meta.url,
  question: "What does the Tokens API say about this account's public token, and which read-only listing endpoints answer it?",
  run: async (api) => {
    const info = await api.get('https://api.mapbox.com/tokens/v2');
    const user = info.json?.token?.user;
    api.secret(user, 'user');
    // keep only what the token is, not who or which: no user, no token id
    const tk = info.json?.token;
    const tokenInfo = tk ? { usage: tk.usage, fields: Object.keys(tk), ...(tk.scopes ? { scopes: tk.scopes } : {}) } : null;
    const list = {};
    for (const [k, url] of Object.entries({
      styles: `https://api.mapbox.com/styles/v1/${user}`,
      tilesets: `https://api.mapbox.com/tilesets/v1/${user}?limit=1`,
      datasets: `https://api.mapbox.com/datasets/v1/${user}?limit=1`,
      tokens: `https://api.mapbox.com/tokens/v2/${user}?limit=1`,
    })) {
      const r = await api.get(url);
      list[k] = { status: r.status, ...(r.ok ? { items: Array.isArray(r.json) ? r.json.length : typeof r.json } : { message: r.message }) };
    }
    return {
      facts: [
        fact('The Tokens API says the token is valid and public', info.json?.code === 'TokenValid' && tokenInfo?.usage === 'pk', { code: info.json?.code, token: tokenInfo }),
        fact("The account's style list answers a public token", list.styles.status === 200, list.styles),
        fact("The account's tileset list answers a public token", list.tilesets.status === 200, list.tilesets),
        fact("The account's dataset list answers a public token", list.datasets.status === 200, list.datasets),
        fact("The account's token list answers a public token", list.tokens.status === 200, list.tokens),
      ],
      // a refused listing is what this experiment measures, not a failure of Mapbox to serve it
      refusals_are_the_finding: true,
    };
  },
});
