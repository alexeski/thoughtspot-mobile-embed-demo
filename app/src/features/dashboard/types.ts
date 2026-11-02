// What DashboardScreen can ask of either Liveboard option.
export type LiveboardHandle = {
  reload: () => void; // sends the HostEvent.Reload host event to the embed
};
