Create a convex.config.ts file in your app's convex/ folder and install the component by calling use:

// convex/convex.config.ts
import { defineApp } from "convex/server";
import r2 from "@convex-dev/r2/convex.config";

const app = defineApp();
app.use(r2);

export default app;

Set your API credentials using the values you recorded earlier:

npx convex env set R2_TOKEN xxxxx
npx convex env set R2_ACCESS_KEY_ID xxxxx
npx convex env set R2_SECRET_ACCESS_KEY xxxxx
npx convex env set R2_ENDPOINT xxxxx
npx convex env set R2_BUCKET xxxxx

Note: All of these values can also be supplied as the second argument to R2. This enables storing values in multiple buckets using the same component. It also enables dynamically setting the values at runtime.

Uploading files#
File uploads to R2 typically use signed urls. The R2 component provides hooks for React and Svelte that handle the entire upload process:

generates the signed url
uploads the file to R2
stores the file's metadata in your Convex database
Instantiate a R2 component client in a file in your app's convex/ folder:

// convex/example.ts
import { R2 } from "@convex-dev/r2";
import { components } from "./\_generated/api";

export const r2 = new R2(components.r2);

export const { generateUploadUrl, syncMetadata } = r2.clientApi({
checkUpload: async (ctx, bucket) => {
// const user = await userFromAuth(ctx);
// ...validate that the user can upload to this bucket
},
onUpload: async (ctx, bucket, key) => {
// ...do something with the key
// This technically runs in the `syncMetadata` mutation, as the upload
// is performed from the client side. Will run if using the `useUploadFile`
// hook, or if `syncMetadata` function is called directly. Runs after the
// `checkUpload` callback.
},
});

Use the useUploadFile hook in your component to upload files:

React:

// src/App.tsx
import { FormEvent, useRef, useState } from "react";
import { useAction } from "convex/react";
import { api } from "../convex/\_generated/api";
import { useUploadFile } from "@convex-dev/r2/react";

export default function App() {
// Passing the entire api exported from `convex/example.ts` to the hook.
// This must include `generateUploadUrl` and `syncMetadata` from the r2 client api.
const uploadFile = useUploadFile(api.example);
const imageInput = useRef<HTMLInputElement>(null);
const [selectedImage, setSelectedImage] = useState<File | null>(null);

async function handleUpload(event: FormEvent) {
event.preventDefault();

    // The file is uploaded to R2, metadata is synced to the database, and the
    // key of the newly created object is returned.
    await uploadFile(selectedImage!);
    setSelectedImage(null);
    imageInput.current!.value = "";

}
return (
<form onSubmit={handleUpload}>
<input
type="file"
accept="image/\*"
ref={imageInput}
onChange={(event) => setSelectedImage(event.target.files![0])}
disabled={selectedImage !== null}
/>
<input
type="submit"
value="Upload"
disabled={selectedImage === null}
/>
</form>
);
}

Svelte:

<script lang="ts">
   import { useUploadFile } from "@convex-dev/r2/svelte";
   import { api } from "../convex/_generated/api";

   const uploadFile = useUploadFile(api.example);

   let selectedImage = $state<File | null>(null);

   async function handleUpload(file: File) {
     await uploadFile(file);
     selectedImage = null;
   }
 </script>

 <form
   onsubmit={() => {
     if (selectedImage) handleUpload(selectedImage);
   }}
 >
   <input
     type="file"
     accept="image/*"
     onchange={(e) => {
       selectedImage = e.currentTarget.files?.[0] ?? null;
     }}
     disabled={selectedImage !== null}
   />
   <button type="submit" disabled={selectedImage === null}> Upload </button>
 </form>

Using a custom object key#
The r2.generateUploadUrl function generates a uuid to use as the object key by default, but a custom key can be provided if desired. Note: the generateUploadUrl function returned by r2.clientApi does not accept a custom key, as that function is a mutation to be called from the client side and you don't want your client defining your object keys. Providing a custom key requires making your own mutation that calls the generateUploadUrl method of the r2 instance.

// convex/example.ts
import { R2 } from "@convex-dev/r2";
import { components } from "./\_generated/api";

export const r2 = new R2(components.r2);

// A custom mutation that creates a key from the user id and a uuid. If the key
// already exists, the mutation will fail.
export const generateUploadUrlWithCustomKey = mutation({
args: {},
handler: async (ctx) => {
// Replace this with whatever function you use to get the current user
const currentUser = await getUser(ctx);
if (!currentUser) {
throw new Error("User not found");
}
const key = `${currentUser.id}.${crypto.randomUUID()}`;
return r2.generateUploadUrl(key);
},
});

Storing Files from Actions#
Files can be stored in R2 directly from actions using the r2.store method. This is useful when you need to store files that are generated or downloaded on the server side.

// convex/example.ts
import { internalAction } from "./\_generated/server";
import { R2 } from "@convex-dev/r2";

const r2 = new R2(components.r2);

export const store = internalAction({
handler: async (ctx) => {
// Download a random image from picsum.photos
const url = "https://picsum.photos/200/300";
const response = await fetch(url);
const blob = await response.blob();

    // This function call is the only required part, it uploads the blob to R2,
    // syncs the metadata, and returns the key. The key is a uuid by default, but
    // an optional custom key can be provided in the options object. A MIME type
    // can also be provided, which will override the type inferred for blobs.
    const key = await r2.store(ctx, blob, {
      key: "my-custom-key",
      type: "image/jpeg",
    });

    // Example use case, associate the key with a record in your database
    await ctx.runMutation(internal.example.insertImage, { key });

},
});

The store method:

Takes a Blob, Buffer, or Uint8Array and stores it in R2
Syncs metadata to your Convex database
Returns the key that can be used to access the file later
Serving Files#
Files stored in R2 can be served to your users by generating a URL pointing to a given file.

Generating file URLs in queries#
The simplest way to serve files is to return URLs along with other data required by your app from queries and mutations.

A file URL can be generated from a object key by the r2.getUrl function of the R2 component client.

// convex/listMessages.ts
import { components } from "./\_generated/api";
import { query } from "./\_generated/server";
import { R2 } from "@convex-dev/r2";

const r2 = new R2(components.r2);

export const list = query({
args: {},
handler: async (ctx) => {
// In this example, messages have an imageKey field with the object key
const messages = await ctx.db.query("messages").collect();
return Promise.all(
messages.map(async (message) => ({
...message,
imageUrl: await r2.getUrl(
message.imageKey,
// Options object is optional, can be omitted
{
// Custom expiration time in seconds, default is 900 (15 minutes)
expiresIn: 60 _ 60 _ 24, // 1 day
}
),
}))
);
},
});

File URLs can be used in img elements to render images:

// src/App.tsx
function Image({ message }: { message: { url: string } }) {
return <img src={message.url} height="300px" width="auto" />;
}

Deleting Files#
Files stored in R2 can be deleted from actions or mutations via the r2.deleteObject function, which accepts an object key.

// convex/images.ts
import { v } from "convex/values";
import { mutation } from "./\_generated/server";
import { R2 } from "@convex-dev/r2";

const r2 = new R2(components.r2);

export const deleteObject = mutation({
args: {
key: v.string(),
},
handler: async (ctx, args) => {
return await r2.deleteObject(ctx, args.key);
},
});

Accessing File Metadata#
File metadata of an R2 file can be accessed from actions via r2.getMetadata:

// convex/images.ts
import { v } from "convex/values";
import { query } from "./\_generated/server";
import { R2 } from "@convex-dev/r2";

const r2 = new R2(components.r2);

export const getMetadata = query({
args: {
key: v.string(),
},
handler: async (ctx, args) => {
return await r2.getMetadata(args.key);
},
});

This is an example of the returned document:

{
"ContentType": "image/jpeg",
"ContentLength": 125338,
"LastModified": "2024-03-20T12:34:56Z"
}

The returned document has the following fields:

ContentType: the ContentType of the file if it was provided on upload
ContentLength: the size of the file in bytes
LastModified: the last modified date of the file
Listing and paginating metadata#
Metadata can be listed or paginated from actions via r2.listMetadata and r2.pageMetadata.

// convex/example.ts
import { query } from "./\_generated/server";
import { R2 } from "@convex-dev/r2";

const r2 = new R2(components.r2);

export const list = query({
args: {
limit: v.optional(v.number()),
},
handler: async (ctx, args) => {
return r2.listMetadata(ctx, args.limit);
},
});

export const page = query({
args: {
paginationOpts: paginationOptsValidator,
},
handler: async (ctx, args) => {
return r2.pageMetadata(ctx, args.paginationOpts);
},
});

Accessing metadata after upload#
The onSyncMetadata callback can be used to run a mutation after every metadata sync. The useUploadFile hook syncs metadata after every upload, so this function will run each time as well.

Because this runs after metadata sync, the r2.getMetadata can be used to access the metadata of the newly uploaded file.

// convex/example.ts
import { R2, type R2Callbacks } from "@convex-dev/r2";
import { components } from "./\_generated/api";

export const r2 = new R2(components.r2);

const callbacks: R2Callbacks = internal.example;

export const { generateUploadUrl, syncMetadata, onSyncMetadata } = r2.clientApi(
{
// Pass the functions from this file back into the component.
// Technically only an object with `onSyncMetadata` is required, the recommended
// pattern is just for convenience.
callbacks,

    onSyncMetadata: async (ctx, args) => {
      // args: { bucket: string; key: string; isNew: boolean }
      // args.isNew is true if the key did not previously exist in your Convex R2
      // metadata table
      const metadata = await r2.getMetadata(ctx, args.key);
      // log metadata of synced object
      console.log("metadata", metadata);
    },

}
);

To serve audio files in your React Native Expo app without exhausting your Convex bandwidth, you should use the Convex Cloudflare R2 component to store your files and then generate direct URLs for users to access those files from R2, bypassing Convex's bandwidth.

### How to Set This Up

1. **Upload Audio Files to R2**
   - Use the R2 component in your Convex backend to generate upload URLs and sync metadata.
   - You can use the `useUploadFile` hook (for React web/Svelte) or implement a similar upload flow in React Native by generating a signed upload URL from Convex and uploading the file directly to R2 from your app.
   - Example for generating an upload URL and syncing metadata is shown in the R2 docs, but for React Native, you’ll need to use `fetch` to POST the file to the signed URL you get from your backend.

2. **Store the R2 Object Key in Convex**
   - After uploading, store the R2 object key in your Convex database, associated with your audio file's metadata.

3. **Generate Direct R2 URLs for Clients**
   - When you want to serve the audio file, use the `r2.getUrl(key)` method in your Convex backend to generate a direct, signed URL to the file in R2.
   - Return this URL to your client in a query or mutation. The client can then use this URL to stream or download the audio file directly from Cloudflare R2, not through Convex, so Convex bandwidth is not used.

   ```ts
   // Example Convex query to return R2 URLs
   import { query } from './_generated/server';
   import { R2 } from '@convex-dev/r2';
   const r2 = new R2(components.r2);

   export const getAudioUrl = query({
     args: { key: v.string() },
     handler: async (ctx, args) => {
       return await r2.getUrl(args.key, { expiresIn: 60 * 60 * 24 }); // 1 day
     },
   });
   ```

4. **Client Usage**
   - In your React Native app, use the returned URL as the source for your audio player. The file will be streamed directly from R2.

### Why This Works

- Files are served directly from Cloudflare R2, which is designed for cost-efficient, high-bandwidth file serving.
- Convex is only used for metadata and generating signed URLs, so your Convex bandwidth is not consumed by file streaming.
- This approach is recommended by Convex staff for apps with high file bandwidth needs, such as audio or video apps [Cloudflare R2 component](https://www.convex.dev/components/cloudflare-r2) and [Discord support thread](https://discord.com/channels/1019350475847499849/1348514697674100776).

### Additional Notes

- Make sure your R2 bucket has the correct CORS policy to allow your app to fetch files.
- The signed URLs generated by `r2.getUrl` can have custom expiration times.

**In summary:**  
Store your audio files in Cloudflare R2 using the Convex R2 component, save the object keys in Convex, and serve users direct R2 URLs generated by your backend. This will let users stream audio without using Convex bandwidth, keeping your costs low and performance high.  
[Cloudflare R2 component](https://www.convex.dev/components/cloudflare-r2#serving-files)
