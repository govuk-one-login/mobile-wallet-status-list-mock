import { getRequestBody } from "../../src/functions/revokeHandler";

describe("getUri", () => {
  it("should throw an error if the JWT is null", () => {
    expect(() => getRequestBody(null)).toThrow("Request body is empty");
  });

  it("should throw an error if the JWT is missing the uri claim", () => {
    const invalidJwt =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MX0.sM_g-e2a0h5z7g7g-e2a0h5z7g7g";
    expect(() => getRequestBody(invalidJwt)).toThrow(
      "JWT payload is missing 'uri' or 'idx' claim",
    );
  });

  it("should return the uri claim if the JWT is valid", () => {
    const validJwt =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmkiOiJodHRwOi8vZXhhbXBsZS5jb20iLCJpZHgiOjF9.sM_g-e2a0h5z7g7g-e2a0h5z7g7g";
    expect(getRequestBody(validJwt).uri).toBe("http://example.com");
  });

  it("should return the idx claim if the JWT is valid", () => {
    const validJwt =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmkiOiJodHRwOi8vZXhhbXBsZS5jb20iLCJpZHgiOjF9.sM_g-e2a0h5z7g7g-e2a0h5z7g7g";
    expect(getRequestBody(validJwt).idx).toBe(1);
  });
});
