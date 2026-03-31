import net from "net";

// Polls a TCP port until it accepts connections or the timeout is reached.
// Used to wait for Prism Proxy and SAM local to be ready before tests run.
export function waitForPort(
  port: number,
  host = "127.0.0.1",
  timeoutMs = 15000,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;

    const attempt = () => {
      const socket = net.connect(port, host);

      socket.on("connect", () => {
        socket.destroy();
        resolve(); // port is open, ready to proceed
      });

      socket.on("error", () => {
        socket.destroy();
        if (Date.now() >= deadline) {
          reject(new Error(`Port ${port} not open after ${timeoutMs}ms`));
        } else {
          setTimeout(attempt, 250); // wait 250ms then try again
        }
      });
    };

    attempt();
  });
}