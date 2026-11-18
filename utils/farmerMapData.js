export const FARMER_LOCATIONS_KEY = 'farmer_farm_locations';
export const FARMER_VISITS_KEY = 'farmer_field_visits';

export function hasValidGpsCoordinates(latitude, longitude) {
  return (
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180
  );
}
