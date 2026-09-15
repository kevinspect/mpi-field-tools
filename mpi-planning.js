(function () {
  "use strict";
  const searchCache = new Map();
  const routeCache = new Map();
  // Both peninsulas, not the office or currently visible map viewport.
  const MICHIGAN_BOUNDS = [-90.5, 41.6, -82.1, 48.35];

  function isMichiganAddress(result) {
    const state = String(result?.state || "").trim();
    const address = String(result?.matchedAddress || result?.address || "");
    return (state ? /^(Michigan|MI|US-MI)$/i.test(state) : /,\s*(?:MI|Michigan)\b/i.test(address))
      && Number.isFinite(result?.latitude) && Number.isFinite(result?.longitude)
      && result.longitude >= MICHIGAN_BOUNDS[0] && result.latitude >= MICHIGAN_BOUNDS[1]
      && result.longitude <= MICHIGAN_BOUNDS[2] && result.latitude <= MICHIGAN_BOUNDS[3];
  }

  function addressResult(feature) {
    const properties = feature?.properties || {};
    const [longitude, latitude] = feature?.geometry?.coordinates || [];
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    const street = [properties.housenumber, properties.street || properties.name].filter(Boolean).join(" ");
    const city = properties.city || properties.town || properties.village || properties.district;
    const state = properties.state === "Michigan" ? "MI" : properties.state;
    const address = [street, city, [state, properties.postcode].filter(Boolean).join(" "), properties.countrycode === "US" ? "" : properties.country].filter(Boolean).join(", ");
    if (!address) return null;
    return { address, matchedAddress: address, latitude, longitude, state: properties.state || "", precise: Boolean(properties.housenumber), provider: "OpenStreetMap / Photon" };
  }

  async function searchAddresses(query, signal) {
    const text = String(query || "").trim();
    if (text.length < 4) return [];
    const key = text.toLowerCase();
    if (searchCache.has(key)) return searchCache.get(key);
    const url = new URL("https://photon.komoot.io/api/");
    Object.entries({ q: text, limit: "10", lang: "en", lat: "44", lon: "-85", zoom: "5", location_bias_scale: "0.1", bbox: MICHIGAN_BOUNDS.join(","), countrycode: "US" }).forEach(([name, value]) => url.searchParams.set(name, value));
    // Both searches are Michigan-bounded. State filtering below also excludes
    // neighboring states that overlap Michigan's rectangular search bounds.
    const michiganUrl = new URL(url);
    michiganUrl.searchParams.set("q", /\bMichigan\b|\bMI\b/i.test(text) ? text : `${text} Michigan`);
    const payloads = await Promise.all([michiganUrl, url].map(async endpoint => {
      const response = await fetch(endpoint, { signal });
      if (!response.ok) return null;
      return response.json();
    }));
    if (payloads.every(payload => !payload)) throw new Error("Address suggestions are temporarily unavailable. Enter the full address and try Calculate Travel.");
    const results = [...new Map(payloads.flatMap(payload => payload?.features || []).map(addressResult).filter(isMichiganAddress).map(result => [result.address, result])).values()]
      .sort((left, right) => Number(right.precise) - Number(left.precise));
    if (searchCache.size > 60) searchCache.delete(searchCache.keys().next().value);
    searchCache.set(key, results);
    return results;
  }

  async function roadTravel(origin, destination, signal) {
    if (![origin?.latitude, origin?.longitude, destination?.latitude, destination?.longitude].every(value => Number.isFinite(Number(value)) && value !== null && value !== "")) throw new Error("Both planning locations need verified coordinates.");
    const points = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
    if (routeCache.has(points)) return routeCache.get(points);
    const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${points}?overview=full&geometries=geojson&alternatives=false&steps=false`, { signal });
    if (!response.ok) throw new Error("Road travel estimates are temporarily unavailable. No appointment was changed.");
    const payload = await response.json();
    const route = payload.routes?.[0];
    if (payload.code !== "Ok" || !route || !Number.isFinite(route.distance) || !Number.isFinite(route.duration)) throw new Error("A driving route could not be calculated between these addresses.");
    const result = { miles: route.distance / 1609.344, minutes: Math.ceil(route.duration / 60), geometry: route.geometry?.coordinates || [], calculatedAt: new Date().toISOString(), provider: "OSRM / OpenStreetMap", liveTraffic: false };
    routeCache.set(points, result);
    return result;
  }

  function earliestArrival(scheduledEnd, driveMinutes, selectedDate, today, now = Date.now()) {
    const end = Date.parse(scheduledEnd || "");
    if (!Number.isFinite(end)) return "";
    const departure = selectedDate === today ? Math.max(end, now) : end;
    return new Date(departure + Math.max(0, Number(driveMinutes)) * 60000).toISOString();
  }

  function defaultJob(jobs, selectedDate, today, currentJobId = "", mode = "auto", now = Date.now()) {
    if (mode === "last") return jobs.at(-1) || null;
    const current = selectedDate === today && currentJobId ? jobs.find(job => String(job.id) === String(currentJobId)) : null;
    return current || jobs.find(job => Date.parse(job.scheduledStart || "") >= (selectedDate === today ? now : Date.parse(`${selectedDate}T00:00:00`))) || jobs.at(-1) || null;
  }

  window.MPI_PLANNING = Object.freeze({ searchAddresses, addressResult, isMichiganAddress, roadTravel, earliestArrival, defaultJob });
})();
