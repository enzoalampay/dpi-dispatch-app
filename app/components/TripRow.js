import { STATUS_TONE, STATUS_LABEL, TYPE_LABEL } from "../../lib/constants";
import { prettyDate } from "../../lib/dates";
import { fmtRange } from "../../lib/time";

// Shared read view of a dispatch request. `children` renders an actions row.
export default function TripRow({ trip, showRequester = false, showDriver = false, showDate = false, children }) {
  const start = trip.scheduledTime || trip.timeNeeded;
  const time = trip.endTime || trip.estDurationMin ? fmtRange(start, trip.estDurationMin || 60) : (start || "—");
  return (
    <div className="trip">
      <div className="head">
        <div className="time">{time}</div>
        <div className="grow">
          <div className="route">
            {trip.pickupLocation} <span className="arrow">→</span> {trip.destination}
          </div>
          <div className="meta">
            {showDate && <span>{prettyDate(trip.serviceDate)} · </span>}
            <span className="tag">{TYPE_LABEL[trip.type] || trip.type}</span>
            {showRequester && trip.requesterName ? <span> · by {trip.requesterName}</span> : null}
          </div>
          {trip.passengers?.length > 0 && (
            <div className="pax">👤 {trip.passengers.join(", ")}</div>
          )}
          {trip.purpose ? <div className="meta">{trip.purpose}</div> : null}
          {showDriver && trip.driverName && (
            <div className="meta">
              🚗 {trip.driverName}
              {trip.vehicleLabel ? ` · ${trip.vehicleLabel}` : ""}
            </div>
          )}
        </div>
        <span className={`badge badge-${STATUS_TONE[trip.status] || "grey"}`}>
          {STATUS_LABEL[trip.status] || trip.status}
        </span>
      </div>
      {children ? <div className="foot">{children}</div> : null}
    </div>
  );
}
