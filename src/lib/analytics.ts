import posthog from "posthog-js";

function isInitialized(): boolean {
  try {
    return posthog.__loaded === true;
  } catch {
    return false;
  }
}

export function trackEvent(
  name: string,
  properties?: Record<string, unknown>
) {
  if (!isInitialized()) return;
  posthog.capture(name, properties);
}

export function trackLinkSubmitted() {
  trackEvent("link_submitted");
}

export function trackLinkPublished(slug: string) {
  trackEvent("link_published", { slug });
}

export function trackPermalinkCopied(slug: string) {
  trackEvent("permalink_copied", { slug });
}

export function trackFilterApplied(filterType: string, value: string) {
  trackEvent("filter_applied", { filterType, value });
}

export function trackContributorProfileViewed(email: string) {
  trackEvent("contributor_profile_viewed", { email });
}
