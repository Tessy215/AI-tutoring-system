import { Client, Account, Databases, Storage, ID } from "appwrite";

const client = new Client();

client
  .setEndpoint("https://fra.cloud.appwrite.io/v1")
  .setProject("6a0c62610037d13e6c11");

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export { ID };