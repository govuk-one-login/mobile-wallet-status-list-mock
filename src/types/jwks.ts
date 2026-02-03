export type JWKS = {
  keys: JWK[];
};

export interface JWK {
  alg: string;
  kid: string;
  kty: "EC";
  use: "sig";
  x: string;
  y: string;
  crv: string;
}
