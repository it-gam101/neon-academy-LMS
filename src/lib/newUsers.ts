/**
 * "Recently registered" window, shared by the dashboard card and the Admin users
 * table so the two can never disagree.
 *
 * NOTE: there is deliberately no "pending" state in the schema — handle_new_user()
 * assigns role='employee', which is also a legitimate PERMANENT role. So this is
 * recency, not status: "who registered since I last looked".
 */
export const NEW_USER_WINDOW_DAYS = 7;

export function newUserWindowStartISO(): string {
  return new Date(Date.now() - NEW_USER_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

export function isRecentlyRegistered(createdAt: string | null | undefined): boolean {
  if (!createdAt) return false;
  return new Date(createdAt).getTime() >= Date.parse(newUserWindowStartISO());
}
