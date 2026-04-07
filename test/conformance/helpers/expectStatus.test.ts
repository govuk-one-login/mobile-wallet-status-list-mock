import { expectStatus } from "./expectStatus";

describe("expectStatus", () => {
  it("resolves when the status matches", async () => {
    const res = new Response("ok", { status: 200 });

    await expect(expectStatus(res, 200)).resolves.toBeUndefined();
  });

  it("rejects when the status does not match", async () => {
    const res = new Response("unprocessable", { status: 422 });

    await expect(expectStatus(res, 200)).rejects.toThrow();
  });

  it("logs the response body on failure", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const res = new Response("internal error", { status: 500 });

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
    const res = new Response("accepted", { status: 202 });

    await expectStatus(res, 202);

    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
