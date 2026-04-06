import { expectStatus } from "./expectStatus";

function makeResponse(status: number, body: string): Response {
  return new Response(body, { status });
}

describe("expectStatus", () => {
  it("resolves when the status matches", async () => {
    const res = makeResponse(200, "ok");
    await expect(expectStatus(res, 200)).resolves.toBeUndefined();
  });

  it("rejects when the status does not match", async () => {
    const res = makeResponse(422, "unprocessable");
    await expect(expectStatus(res, 200)).rejects.toThrow();
  });

  it("logs the response body on failure", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const res = makeResponse(500, "internal error");

    await expect(expectStatus(res, 200)).rejects.toThrow();

    expect(consoleSpy).toHaveBeenCalledWith(
      "Expected 200, got 500. Body:",
      "internal error",
    );
    consoleSpy.mockRestore();
  });

  it("does not log on success", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const res = makeResponse(202, "accepted");

    await expectStatus(res, 202);

    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
