/** The scheduling half of a marketing banner, the part both the storefront
 * and the Storefront Builder's section health need to agree on. */
export type CampaignSchedule = { active: boolean; startDate: string; endDate: string };

/**
 * A campaign is live when it is marked Active and the current time falls
 * inside its start/end window. Either end may be left empty: an editor can
 * schedule "Saison été" to switch itself off at the end of August without
 * coming back to untick it.
 */
export function isCampaignLive(campaign: CampaignSchedule, now: number): boolean {
  if (!campaign.active) return false;
  if (campaign.startDate && now < new Date(campaign.startDate).getTime()) return false;
  if (campaign.endDate && now > new Date(campaign.endDate).getTime()) return false;
  return true;
}
