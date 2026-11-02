// All backend settings, read once from server/.env (see .env.example).
// This is the only place ThoughtSpot credentials live – never in the app.

export const {
  TS_HOST = 'https://se-thoughtspot-cloud.thoughtspot.cloud',
  TS_USERNAME,
  TS_SECRET_KEY, // trusted auth (recommended)
  TS_PASSWORD, // ...or a password, fine for a demo
  TS_ORG_ID, // optional: Org to log in to (0 = Primary). Defaults to the secret key's Org.
  MODEL_ID = 'cd252e5c-b552-49a8-821d-3eadaa049cca', // data source Spotter answers from
  MCP_URL = 'https://agent.thoughtspot.app/token/mcp?api-version=latest', // pin a date in production
  PORT = 4000,
} = process.env;

if (!TS_USERNAME || !(TS_SECRET_KEY || TS_PASSWORD)) {
  console.error('Set TS_USERNAME and TS_SECRET_KEY (or TS_PASSWORD) in server/.env');
  process.exit(1);
}
