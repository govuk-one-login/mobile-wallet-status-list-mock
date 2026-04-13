import net from "node:net";
import { waitForPort } from "./waitForPort";

jest.mock("node:net");

const mockNet = jest.mocked(net);

function makeSocket(behavior: "connect" | "error") {
  const socket = { on: jest.fn(), destroy: jest.fn() };
  socket.on.mockImplementation((event: string, handler: () => void) => {
    if (event === behavior) handler();
    return socket;
  });
  return socket;
}

describe("waitForPort", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("resolves when the port connects on the first attempt", async () => {
    mockNet.connect = jest.fn().mockReturnValue(makeSocket("connect"));

    await expect(waitForPort(3000)).resolves.toBeUndefined();
    expect(mockNet.connect).toHaveBeenCalledWith(3000, "127.0.0.1");
  });

  it("uses the provided host", async () => {
    mockNet.connect = jest.fn().mockReturnValue(makeSocket("connect"));

    await expect(waitForPort(8080, "0.0.0.0", 5000)).resolves.toBeUndefined();
    expect(mockNet.connect).toHaveBeenCalledWith(8080, "0.0.0.0");
  });

  it("destroys the socket on a successful connect", async () => {
    const socket = makeSocket("connect");
    mockNet.connect = jest.fn().mockReturnValue(socket);

    await waitForPort(3000);

    expect(socket.destroy).toHaveBeenCalled();
  });

  it("resolves after retrying when the port is not immediately open", async () => {
    mockNet.connect = jest
      .fn()
      .mockReturnValueOnce(makeSocket("error"))
      .mockReturnValueOnce(makeSocket("error"))
      .mockReturnValueOnce(makeSocket("connect"));

    const promise = waitForPort(3000, "127.0.0.1", 15000);
    await jest.runAllTimersAsync();

    await expect(promise).resolves.toBeUndefined();
    expect(mockNet.connect).toHaveBeenCalledTimes(3);
  });

  it("destroys the socket on error before retrying", async () => {
    const errorSocket = makeSocket("error");
    mockNet.connect = jest
      .fn()
      .mockReturnValueOnce(errorSocket)
      .mockReturnValueOnce(makeSocket("connect"));

    const promise = waitForPort(3000, "127.0.0.1", 15000);
    await jest.runAllTimersAsync();
    await promise;

    expect(errorSocket.destroy).toHaveBeenCalled();
  });

  it("rejects when the deadline is exceeded", async () => {
    jest.useRealTimers();
    mockNet.connect = jest.fn().mockReturnValue(makeSocket("error"));

    await expect(waitForPort(3000, "127.0.0.1", 0)).rejects.toThrow(
      "Port 3000 not open after 0ms",
    );
  });
});
