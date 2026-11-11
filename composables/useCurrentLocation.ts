import { shallowRef } from "vue";

export type LocateOutcome =
  | { status: "placed"; latitude: number; longitude: number }
  | { status: "unavailable" }
  | { status: "denied"; error: unknown };

type GeoLike = {
  getCurrentPosition: (
    success: (position: { coords: { latitude: number; longitude: number } }) => void,
    error: (error: unknown) => void,
  ) => void;
};

export function useCurrentLocation() {
  const locating = shallowRef(false);

  function request(geolocation: GeoLike | undefined): Promise<LocateOutcome> {
    locating.value = true;
    return new Promise((resolve) => {
      const finish = (outcome: LocateOutcome) => {
        locating.value = false;
        resolve(outcome);
      };

      if (!geolocation) {
        finish({ status: "unavailable" });
        return;
      }

      geolocation.getCurrentPosition(
        ({ coords }) => {
          finish({
            status: "placed",
            latitude: coords.latitude,
            longitude: coords.longitude,
          });
        },
        (error) => {
          finish({ status: "denied", error });
        },
      );
    });
  }

  return { locating, request };
}
