What's the maximum level of privacy an application can offer? Platforms like Convex encrypt data at rest but allow you to interact with it in unencrypted form via user-defined functions running on the server. This is tremendously useful but occasionally there's data that you don't want to exist in unencrypted form anywhere.

Consider a scenario where I need to send a crypto passphrase to my partner. That passphrase should be encrypted on a computer that I control, decrypted on a computer my partner controls, and not be accessible anywhere else. This is called end-to-end encryption, because only the endpoints of the communication — my partner and I — can see the secret passphrase.

I wanted to see what it would take to build end-to-end encryption on top of Convex, so I built Whisper.

How to use Whisper
Check out https://whisper-convex.vercel.app/, the final product.

Screenshot of the app in use
Screenshot of the app in use

Type in a secret message
The message is encrypted with an optional client-side password and stored in Convex.
Send the private URL to the recipient(s), through an external secure channel.
A recipient retrieves the encrypted message from Convex, and decrypts the message in their browser.
Features:

No login or setup, for either the sender or recipient.
In case the URL is intercepted, the sender can see the IP address of everyone who uses the URL to read the secret message, in a list that reactively updates.
The message expires after a certain number of accesses, or a configurable duration.
When the message expires, a scheduled mutation deletes it from Convex so no one can access it, even with the URL.
How Whisper works
The full source code is at https://github.com/ldanilek/whisper, and I’ll highlight some of the key components here.

To create a Whisper — an encrypted secret message — we use AES symmetric encryption before calling the createWhisper mutation in Convex. This code runs in the browser, so the raw URL and secret are never sent to Convex.

if (password.length === 0) {
  password = uuid.v4();
}
const encryptedSecret = CryptoJS.AES.encrypt(secret, password).toString();
const passwordHash = hashPassword(password);
await createWhisperMutation(
	name, encryptedSecret, passwordHash, creatorKey, expiration,
);

Accessing the Whisper requires password hash to match, and it’s a mutation so the access can be recorded. This code runs in a transaction on Convex servers.

// accessWhisper.ts
export default mutation({
  args: {
      whisperName: v.string();
      passwordHash: v.string();
      accessKey: v.string();
      ip: v.union(v.string(), v.null());
  },
  handler: async (
    { db },
    {
      whisperName,
      passwordHash,
      accessKey,
      ip,
    }
  ) => {
    const whisperDoc = await getValidWhisper(db, whisperName, true);
    if (!timingSafeEqual(whisperDoc.passwordHash, passwordHash)) {
      throw Error("incorrect password");
    }
    await db.insert("accesses", {
      name: whisperName,
      accessKey,
      ip,
    });
  },
});

Once the access is registered, we use a Convex query to read the encrypted message, and AES to decrypt it.

const SecretDisplay = ({name, accessKey, password}) => {
  const encryptedSecret = useQuery(api.readSecret.default, name, accessKey);
  return <div>{
    encryptedSecret ?
		CryptoJS.AES.decrypt(encryptedSecret, password).toString(CryptoJS.enc.Utf8) 
		: "Loading..."
  }</div>;
}

To delete expired secrets, we schedule a mutation to delete the encrypted message.

// inside createWhisper.ts
await scheduler.runAt(expireTime, internal.deleteExpired.default, whisperName, creatorKey);
// inside expireNow.ts
await db.patch(whisperDoc!._id, {
  encryptedSecret: "",
});