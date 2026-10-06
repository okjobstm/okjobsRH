import { createAdminClient } from "./admin.ts";

const CV_BUCKET = "cvs";
const PAGE_SIZE = 100;

/**
 * A cvPath comes from the database and every caller used to re-derive its own
 * containment rule. Two segments only, no "..", nothing that could address a
 * bucket outside the one this app writes to: <candidateId>/<field>_<uuid>.<ext>.
 */
export function isValidCvKey(key: string): boolean {
  return (
    /^[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+$/.test(key) && !key.includes("..")
  );
}

export async function uploadCv(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  if (!isValidCvKey(key)) throw new Error(`refusing invalid CV key: ${key}`);

  const { error } = await createAdminClient()
    .storage.from(CV_BUCKET)
    .upload(key, body, { contentType, upsert: true });

  if (error) throw new Error(`cv upload failed: ${error.message}`);
}

export async function downloadCv(key: string): Promise<Buffer | null> {
  if (!isValidCvKey(key)) throw new Error(`refusing invalid CV key: ${key}`);

  const { data, error } = await createAdminClient()
    .storage.from(CV_BUCKET)
    .download(key);

  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}

// Throws rather than returning a status: a delete that quietly reports failure
// gets counted as a deletion by the purge and the reaper, and leaves the object
// behind with nothing left to notice. A key that is already gone is not an error.
export async function removeCv(key: string): Promise<void> {
  if (!isValidCvKey(key)) throw new Error(`refusing invalid CV key: ${key}`);

  const { error } = await createAdminClient().storage.from(CV_BUCKET).remove([key]);
  if (error) throw new Error(`cv delete failed: ${error.message}`);
}

async function listPage(folder: string): Promise<
  Array<{ name: string; id: string | null }>
> {
  const bucket = createAdminClient().storage.from(CV_BUCKET);
  const rows: Array<{ name: string; id: string | null }> = [];

  // list() is neither recursive nor transparent: it caps at 100 rows per call and
  // says nothing about how many are left. Stop on a short page, not on an empty
  // one, or a bucket holding exactly 100 keys silently loses its 101st.
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await bucket.list(folder, {
      limit: PAGE_SIZE,
      offset,
    });
    if (error) {
      throw new Error(`cannot list ${CV_BUCKET}/${folder}: ${error.message}`);
    }
    rows.push(...data);
    if (data.length < PAGE_SIZE) return rows;
  }
}

/**
 * Every CV key in the bucket. Two levels: the root holds one folder per
 * candidate, each folder holds the files. Folder entries carry a null id.
 */
export async function listCvKeys(): Promise<string[]> {
  const folders = (await listPage("")).filter((entry) => entry.id === null);
  const keys: string[] = [];

  for (const folder of folders) {
    for (const file of await listPage(folder.name)) {
      if (file.id !== null) keys.push(`${folder.name}/${file.name}`);
    }
  }

  return keys;
}