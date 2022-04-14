import { CeramicClient } from "@ceramicnetwork/http-client";
import { TileDocument } from "@ceramicnetwork/stream-tile";
import KeyDidResolver from "key-did-resolver";
import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";

import * as random from "@stablelib/random";
import { fromString, toString } from "uint8arrays";

const seed = random.randomBytes(32);
const client = new CeramicClient("https://ceramic-clay.3boxlabs.com");

let authenticatedDid;

async function authenticateApp() {
  if (!seed) {
    throw new Error("Seed not provided");
  }
  const resolver = {
    ...KeyDidResolver.getResolver(),
  };
  client.did = new DID({ resolver });

  const provider = new Ed25519Provider(seed);

  client.did.setProvider(provider);

  authenticatedDid = await client.did.authenticate();

  return authenticatedDid;
}

async function ensureAppAuthenticated() {
  if (!client.did?.authenticated) {
    await authenticateApp();
  }
}

async function storeMetadata(metadata) {
  await ensureAppAuthenticated();

  return TileDocument.create(client, metadata);
}

async function updateMetadata(streamId, metadata) {
  await ensureAppAuthenticated();

  const doc = await TileDocument.load(client, streamId);

  console.log("controllers", JSON.stringify(doc.metadata.controllers));
  console.log("content", JSON.stringify(doc.content));
  if (client.did) {
    console.log("did", client.did.id.toString());
  }
  console.log("metadata", JSON.stringify(metadata));

  await doc.update(metadata);
}

async function main() {
  const c1 = {
    slug: "bh-test-33",
    tags: ["React", "React Native"],
    title: "BH Test 33",
    createdAt: 1649767966626,
    difficulty: "Beginner",
    description: "This is cool",
    publishedUri: "test-uri-1",
  };
  const c2 = {
    slug: "bh-test-33",
    tags: ["React", "React Native"],
    title: "BH Test 33",
    createdAt: 1649767966626,
    difficulty: "Beginner",
    description: "This is cool",
    publishedUri: "test-uri-2",
  };
  const stream = await storeMetadata(c1);
  console.log("1", stream.state);
  await updateMetadata(stream.id, c2);
  console.log("2", stream.state);
}

main();
