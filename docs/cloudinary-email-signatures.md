# Cloudinary setup for email signatures

Cloudinary hosts the signature images independently from the EPDesk website. After
the images are uploaded and the generated manifest is deployed, copied signatures
use `https://res.cloudinary.com/...` URLs and continue loading when EPDesk is offline.

## 1. Create a free Cloudinary account

1. Open [Cloudinary registration](https://cloudinary.com/users/register_free).
2. Create and verify the account.
3. Open the [Cloudinary Console dashboard](https://console.cloudinary.com/app/home/dashboard).

## 2. Get the credentials

1. Copy **Cloud name** from the **Product Environment** section of the dashboard.
2. Open [Settings → API Keys](https://console.cloudinary.com/app/settings/api-keys).
3. Copy the **API Key**.
4. Reveal and copy the **API Secret**.

The API secret is a password. Keep it only in `.env` and deployment secret settings.
Never place it in browser code, commit it, or give it a `NEXT_PUBLIC_` prefix.

## 3. Configure the project

Copy `.env.example` to `.env` if `.env` does not already exist. Add:

```env
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
CLOUDINARY_SIGNATURE_FOLDER="email-signatures"
```

The existing `/api/upload` route uses the same three credentials for ticket
attachments. `CLOUDINARY_SIGNATURE_FOLDER` is optional and defaults to
`email-signatures`.

## 4. Check and upload

Preview what will be uploaded without using credentials:

```bash
npm run cloudinary:signatures:dry-run
```

Check that the credentials work:

```bash
npm run cloudinary:signatures:check
```

Upload every GIF, JPEG, PNG, and WebP file in `public/Email Signature`:

```bash
npm run cloudinary:signatures
```

The upload command:

- uploads with stable public IDs under the `email-signatures` folder;
- overwrites an existing matching asset when rerun;
- never writes the API secret to client code;
- writes public HTTPS delivery URLs to
  `lib/email-signature-cloudinary.json`.

If any upload fails, the existing manifest is left unchanged.

## 5. Deploy

1. Review `lib/email-signature-cloudinary.json`. It must contain one URL per image.
2. Commit that manifest with the code.
3. Deploy the application.
4. Open an email-signature page. The status box should show
   `res.cloudinary.com` as the image host.
5. Copy the signature into Gmail or Outlook and send a test message.
6. Stop the local EPDesk server and reopen the received message. The images should
   still load from Cloudinary.

The API credentials are required for uploading and for the existing ticket upload
API. They are not required by recipients viewing a signature because the generated
Cloudinary delivery URLs are public.

## Updating signatures later

After adding, replacing, or removing files:

```bash
npm run gen:signatures
npm run cloudinary:signatures
```

Then deploy the updated `lib/email-signatures.js` and
`lib/email-signature-cloudinary.json`.

## Credential safety

- Do not commit `.env`.
- Add the three Cloudinary values as protected environment variables in Netlify.
- Rotate an API key immediately if its secret is exposed.
- Public delivery URLs and the cloud name are safe to include in the manifest.
