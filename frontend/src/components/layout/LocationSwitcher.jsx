import { useMemo } from "react";
import { MapPin } from "lucide-react";
import { useLocationScope } from "../../context/LocationScopeContext.jsx";
import SelectField from "../subcomponents/SelectField.jsx";
import "./LocationSwitcher.css";

export default function LocationSwitcher() {
  const { locations, activeLocationId, setActiveLocation, showSwitcher, mode, loading } =
    useLocationScope();

  const options = useMemo(() => {
    const locOptions = locations.map((loc) => ({
      value: String(loc._id),
      label: `${loc.isCentral ? "HO · " : ""}${loc.name || loc.locationId}`,
    }));
    if (mode === "all") {
      return [{ value: "", label: "All locations" }, ...locOptions];
    }
    return locOptions;
  }, [locations, mode]);

  if (loading || !showSwitcher) return null;

  return (
    <div className="location-switcher" aria-label="Working location">
      <MapPin className="location-switcher__icon" size={16} aria-hidden />
      <span className="location-switcher__label">Location</span>
      <SelectField
        hideLabel
        aria-label="Working location"
        options={options}
        value={activeLocationId || ""}
        onChange={(value) => {
          if (value) setActiveLocation(value);
        }}
      />
    </div>
  );
}
