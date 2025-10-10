import { createToken } from "../../../src/common/token/createToken";
import { derToJose } from "ecdsa-sig-formatter";
import { sign } from "../../../src/common/aws/kms";

jest.mock("../../../src/common/aws/kms");
jest.mock("ecdsa-sig-formatter");

describe("createToken", () => {
  let dateSpy: jest.SpyInstance;

  beforeAll(() => {
    const mockTimestamp = 1739491200 * 1000;
    dateSpy = jest.spyOn(global.Date, "now").mockReturnValue(mockTimestamp);
  });

  afterAll(() => {
    dateSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(sign).mockResolvedValue(new Uint8Array([1, 2, 3]));
    jest.mocked(derToJose).mockReturnValue("mockJoseSignature");
  });

  const testParams = {
    selfUrl: "https://test-status-list.com/",
    statusList: { bits: 2, lst: "eNpzcAEAAMYAhQ" },
    uri: "https://test-status-list.com/t/36940190-e6af-42d0-9181-74c944dc4af7",
    keyId: "test-key-id",
  };

  it("should create a valid JWT with correct header and payload", async () => {
    const token = await createToken(testParams);

    expect(token).toMatch(/^[^.]+\.[^.]+\.[^.]+$/);

    const [header, payload, signature] = token.split(".");

    const decodedHeader = JSON.parse(
      Buffer.from(header, "base64url").toString(),
    );
    expect(decodedHeader).toEqual({
      alg: "ES256",
      kid: testParams.keyId,
      typ: "statuslist+jwt",
    });

    const decodedPayload = JSON.parse(
      Buffer.from(payload, "base64url").toString(),
    );
    expect(decodedPayload).toEqual({
      iat: 1739491200,
      exp: 1739491200 + 2592000,
      iss: testParams.selfUrl,
      status_list: testParams.statusList,
      sub: testParams.uri,
      ttl: 2592000,
    });

    expect(signature).toEqual("mockJoseSignature");
  });

  it("should sign the correct message with the correct key", async () => {
    await createToken(testParams);

    const expectedMessage =
      "eyJhbGciOiJFUzI1NiIsImtpZCI6InRlc3Qta2V5LWlkIiwidHlwIjoic3RhdHVzbGlzdCtqd3QifQ.eyJpYXQiOjE3Mzk0OTEyMDAsImV4cCI6MTc0MjA4MzIwMCwiaXNzIjoiaHR0cHM6Ly90ZXN0LXN0YXR1cy1saXN0LmNvbS8iLCJzdGF0dXNfbGlzdCI6eyJiaXRzIjoyLCJsc3QiOiJlTnB6Y0FFQUFNWUFoUSJ9LCJzdWIiOiJodHRwczovL3Rlc3Qtc3RhdHVzLWxpc3QuY29tL3QvMzY5NDAxOTAtZTZhZi00MmQwLTkxODEtNzRjOTQ0ZGM0YWY3IiwidHRsIjoyNTkyMDAwfQ";
    expect(sign).toHaveBeenCalledWith(expectedMessage, testParams.keyId);
  });

  it("should convert the signature from DER to JOSE format", async () => {
    await createToken(testParams);

    // The mocked sign function returns Uint8Array([1, 2, 3]), which base64url-encodes to 'AQID'
    const expectedDerSignature = "AQID";
    expect(derToJose).toHaveBeenCalledWith(expectedDerSignature, "ES256");
    expect(derToJose).toHaveLastReturnedWith("mockJoseSignature");
  });

  it("should propagate signing errors", async () => {
    jest.mocked(sign).mockRejectedValueOnce(new Error("KMS error"));

    await expect(createToken(testParams)).rejects.toThrow("KMS error");
  });
});
