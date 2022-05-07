## Setup

1. Install gcloud: https://cloud.google.com/sdk/docs/install
2. Login: `gcloud auth login`
3. Create configuration: `gcloud config configurations create <CONFIG_NAME>`
4. Set Project & account `gcloud set project <YOUR_GCP_PROJECT_ID>`, `gcloud set account <YOUR_GCP_ACCOUNT>`
5. `npm install`

## Deployment

1. Create or update .env.yaml (same variable names as .env.local.yaml)
2. Deploy: `npm run deploy`

References:

- functions framework: https://github.com/GoogleCloudPlatform/functions-framework-nodejs/blob/master/docs/typescript.md
- Call cloud function with authentication: https://cloud.google.com/functions/docs/securing/authenticating

## Local Development

1. Update .env.local.yaml
2. Run `npm run watch`

References:

- environment variable setup: https://github.com/GoogleCloudPlatform/functions-framework-nodejs/issues/38#issuecomment-599597555
