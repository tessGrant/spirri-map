export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';

export interface Address {
  name: string;
  street: string;
  zipCode: string;
  city: string;
  countryISO: string;
}

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface Location {
  locationId: number | string;
  address: Address;
  coordinates: Coordinates;
  connectorType: string;
  status?: string;
  maxPower: number;
  public: boolean;
  type: string;
}
