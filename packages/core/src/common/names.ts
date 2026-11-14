/**
 * An npm name as the registry accepts a new one: lowercase, URL-safe, optionally scoped, 214
 * characters at most. Checked before any request, since the name lands in a URL.
 */
const NPM_NAME_PATTERN = /^(?=.{1,214}$)(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

/** A crate name as crates.io accepts one: a letter, then letters, digits, `-` or `_`, 64 at most. */
const CRATE_NAME_PATTERN = /^[A-Za-z][\w-]{0,63}$/;

export { CRATE_NAME_PATTERN, NPM_NAME_PATTERN };
