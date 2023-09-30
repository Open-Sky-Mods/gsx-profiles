export type Profile = {
  airport: string;
  airportCreator: string;
  requiredAirportVersion?: string;

  /**
   * An identifier to distinguish multiple profiles for the same airport addon
   */
  profileId: string;

  authors: string[];
  contributors: string[];
  description: string;
  version: string;
  variants: [
    {
      name: string;
      files: string[];
    }
  ];
};
