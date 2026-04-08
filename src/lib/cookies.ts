import Cookies from "js-cookie";

const CONTRIBUTOR_NAME_KEY = "kh_contributor_name";
const CONTRIBUTOR_EMAIL_KEY = "kh_contributor_email";
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
