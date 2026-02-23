/* Table schema:
CREATE TABLE kv_store_26050ec2 (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);
*/

// This file provides a simple key-value interface for storing application data.
// It uses Supabase PostgreSQL as the backing store.

import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const client = () => createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
);

// Set stores a key-value pair in the database.
export async function set(key: string, value: unknown) {
  const { error } = await client()
    .from("kv_store_26050ec2")
    .upsert({ key, value });
  if (error) throw error;
}

// Get retrieves a value by key from the database.
export async function get(key: string) {
  const { data, error } = await client()
    .from("kv_store_26050ec2")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) throw error;
  return data?.value;
}

// Del deletes a key-value pair from the database.
export async function del(key: string) {
  const { error } = await client()
    .from("kv_store_26050ec2")
    .delete()
    .eq("key", key);
  if (error) throw error;
}

// Mget retrieves multiple values by their keys.
export async function mget(keys: string[]) {
  const { data, error } = await client()
    .from("kv_store_26050ec2")
    .select("key, value")
    .in("key", keys);
  if (error) throw error;
  return data?.map((row) => row.value) || [];
}

// Mset stores multiple key-value pairs.
export async function mset(entries: Record<string, unknown>) {
  const rows = Object.entries(entries).map(([key, value]) => ({ key, value }));
  const { error } = await client()
    .from("kv_store_26050ec2")
    .upsert(rows);
  if (error) throw error;
}

// Mdel deletes multiple keys.
export async function mdel(keys: string[]) {
  const { error } = await client()
    .from("kv_store_26050ec2")
    .delete()
    .in("key", keys);
  if (error) throw error;
}

// GetByPrefix retrieves all key-value pairs with keys matching a prefix.
export async function getByPrefix(prefix: string) {
  const { data, error } = await client()
    .from("kv_store_26050ec2")
    .select("key, value")
    .like("key", `${prefix}%`);
  if (error) throw error;
  return data?.map((row) => row.value) || [];
}
