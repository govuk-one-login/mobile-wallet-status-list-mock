import {
  base64Encoder,
  buildHeader,
  buildPayload,
  createToken,
} from "../../../src/common/token/createToken";
import { derToJose } from "ecdsa-sig-formatter";
import { sign } from "../../../src/common/aws/kms";
import { StatusList } from "../../../src/common/types/statusList";

jest.mock("../../../src/common/aws/kms");
jest.mock("ecdsa-sig-formatter");
jest.mocked(sign).mockResolvedValue(new Uint8Array([1, 2, 3]));
jest.mocked(derToJose).mockReturnValue("mockJoseSignature");

const TTL = 3600;
const ALGORITHM = "ES256";
const mockKeyId = "test-key-id";
const mockUri =
  "https://test-status-list.com/t/36940190-e6af-42d0-9181-74c944dc4af7";
const mockStatusList: StatusList = { bits: 32, lst: "testList" };
const selfUrl = "https://test-status-list.com";

describe("createToken", () => {
  it("should create a valid token", async () => {
    const token = await createToken({
      selfUrl: selfUrl,
      statusList: mockStatusList,
      uri: mockUri,
      keyId: mockKeyId,
    });
    expect(token).toBeDefined();
    expect(token).toContain(".");
    expect(token.split(".").length).toBe(3);
  });

  it("should encode header and payload correctly", async () => {
    const header = buildHeader(mockKeyId);
    const payload = buildPayload(selfUrl, mockStatusList, mockUri);
    const encodedHeader = base64Encoder(JSON.stringify(header));
    const encodedPayload = base64Encoder(JSON.stringify(payload));
    const token = await createToken({
      selfUrl: selfUrl,
      statusList: mockStatusList,
      uri: mockUri,
      keyId: mockKeyId,
    });
    const [tokenHeader, tokenPayload] = token.split(".").slice(0, 2);
    expect(tokenHeader).toBe(encodedHeader);
    expect(tokenPayload).toBe(encodedPayload);
  });

  it("should include correct timestamp and TTL in payload", async () => {
    const token = await createToken({
      selfUrl: selfUrl,
      statusList: mockStatusList,
      uri: mockUri,
      keyId: mockKeyId,
    });
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString(),
    );
    const timestamp = Math.floor(Date.now() / 1000);
    expect(payload.iat).toBeGreaterThanOrEqual(timestamp - 10);
    expect(payload.exp).toBe(timestamp + TTL);
    expect(payload.ttl).toBe(TTL);
  });
});

describe("Helper Functions", () => {
  it("should build a correct header", () => {
    const header = buildHeader(mockKeyId);
    expect(header).toEqual({
      alg: ALGORITHM,
      kid: mockKeyId,
      typ: "statuslist+jwt",
    });
  });

  it("should build a correct payload", () => {
    const payload = buildPayload(selfUrl, mockStatusList, mockUri);
    const timestamp = Math.floor(Date.now() / 1000);
    expect(payload).toEqual({
      iat: timestamp,
      iss: "https://test-status-list.com",
      exp: timestamp + TTL,
      status_list: mockStatusList,
      sub: mockUri,
      ttl: TTL,
    });
  });

  it("should correctly encode data using base64url", () => {
    const data = "test data";
    const encodedData = base64Encoder(data);
    expect(Buffer.from(encodedData, "base64url").toString()).toBe(data);
  });
});
