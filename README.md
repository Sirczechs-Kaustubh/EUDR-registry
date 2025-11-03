## EUDR Certificates Portal

Next.js 14 + TypeScript application that serves as a searchable registry of EUDR certificates stored in MongoDB. The app can run against a local MongoDB instance for development or a hosted MongoDB Atlas cluster for shared environments.

## Prerequisites
- Node.js 18 or higher
- npm (ships with Node.js)
- MongoDB Community Server (optional: only if you want to run MongoDB locally)
- MongoDB Atlas account (optional: only if you want to use a managed cluster)

## Install dependencies

```bash
npm install
```

## Environment configuration

Create a `.env.local` file in the project root (never commit this file) and add a MongoDB connection string:

```ini
# Connect to a local MongoDB instance
MONGODB_URI=mongodb://localhost:27017/Dilify

# Example Atlas connection string. Replace username, password, host and database.
# MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-host>/<database>?retryWrites=true&w=majority&appName=<appName>
```

Tips:
- Make sure the database name at the end of the URI is `Dilify`; the models expect that database.
- When pasting Atlas connection strings, URL-encode any special characters in the password (`@`, `/`, `:` etc.).
- After editing `.env.local`, restart the dev server so the new URI is picked up.

## Populate MongoDB data

### Option A: copy your local data into Atlas
1. Export the local collection:
   ```bash
   mongoexport --uri "mongodb://localhost:27017/Dilify" --collection certificates --out certificates.json --jsonArray
   ```
2. Import that data into Atlas:
   ```bash
   mongoimport --uri "<YOUR_ATLAS_URI>" --collection certificates --file certificates.json --jsonArray --mode=upsert
   ```
3. Verify the documents exist:
   ```bash
   mongosh "<YOUR_ATLAS_URI>" --eval "db.certificates.find().limit(3)"
   ```

> `mongoexport`, `mongoimport`, and `mongosh` are included with MongoDB Database Tools. Install them from [MongoDB downloads](https://www.mongodb.com/try/download/database-tools) if needed.

### Option B: seed Atlas from scratch
1. Connect to the cluster:
   ```bash
   mongosh "<YOUR_ATLAS_URI>"
   ```
2. Insert sample certificates:
   ```javascript
db.certificates.insertMany([
  {
    certificateNumber: "DIL-001",
    certificateHolder: "Example Holder",
    address: "123 Sample Street, Example City",
    dateOfIssue: ISODate("2024-01-15T00:00:00Z"),
    status: "Valid",
    complianceBody: "Dilify",
    countryOfOrigin: "France",
    certificateCanvaLink: "https://www.canva.com/design/..."
  },
  {
    certificateNumber: "DIL-002",
    certificateHolder: "Second Example Estates Ltd",
    address: "45 Forest Road, Berlin",
    dateOfIssue: ISODate("2023-09-01T00:00:00Z"),
    status: "Expired",
    complianceBody: "Dilify",
    countryOfOrigin: "Germany",
    certificateCanvaLink: "https://www.canva.com/design/..."
  }
]);
```

If the Atlas import returns zero documents, double-check:
- Your Atlas user has read/write privileges on the `Dilify` database.
- Your current IP is whitelisted in the Atlas Network Access list.
- You are referencing the correct database (`/<database>` at the end of the URI).

## Run the development server

```bash
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000) and use the search inputs to query certificates. The API routes connect to the database specified by `MONGODB_URI`.

## Troubleshooting checklist
- `MongoNetworkError`: ensure the IP you are connecting from is allowed in Atlas.
- Requests return empty arrays: confirm the `certificates` collection in the `Dilify` database has documents and that fields such as `certificateHolder` or `certificateNumber` are populated.
- Atlas password contains special characters: URL-encode the password before placing it in `.env.local`.

## Outstanding questions
1. Should long-term data entry stay in MongoDB or move to another system (Google Sheets, Admin UI, etc.)?
2. Is MongoDB the final choice for the registry backend?
3. Should the registry surface certificate images from Canva directly, or should they be stored elsewhere (e.g., Google Drive) and linked from the database?
4. Is an internal admin panel needed for non-technical users to manage the registry?
