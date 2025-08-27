import { JsonWebKey } from "node:crypto";

export type JWKS = {
  keys: JWK[];
};

export interface JWK extends JsonWebKey {
  alg: string;
  kid: string;
  kty: "RSA" | "EC";
  use: "enc" | "sig";
}
