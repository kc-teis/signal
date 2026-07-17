import Cookies from "js-cookie";

const CONTRIBUTOR_NAME_KEY = "kh_contributor_name";
const CONTRIBUTOR_EMAIL_KEY = "kh_contributor_email";
const DEVICE_ID_KEY = "kh_device_id";
const COOKIE_EXPIRY = 365; // days

export function getContributorCookies() {
  return {
    name: Cookies.get(CONTRIBUTOR_NAME_KEY) || "",
    email: Cookies.get(CONTRIBUTOR_EMAIL_KEY) || "",
  };
}

export function setContributorCookies(name: string, email: string) {
  Cookies.set(CONTRIBUTOR_NAME_KEY, name, { expires: COOKIE_EXPIRY });
  Cookies.set(CONTRIBUTOR_EMAIL_KEY, email, { expires: COOKIE_EXPIRY });
}

// Anonymous per-browser identity used only to dedupe upvotes — not tied to a
// real name/email, so it can't distinguish or display "who" upvoted.
export function getOrCreateDeviceId() {
  let id = Cookies.get(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    Cookies.set(DEVICE_ID_KEY, id, { expires: COOKIE_EXPIRY });
  }
  return id;
}
