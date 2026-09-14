import tls from "node:tls";

export type TlsReport = { authorized: boolean; error?: string; subject?: string; altNames?: string; validTo?: string };

const asString = (v: string | string[] | undefined): string | undefined => (Array.isArray(v) ? v[0] : v);

export function inspectTls(host: string): Promise<TlsReport> {
  return new Promise((resolve) => {
    const socket = tls.connect({ host, port: 443, servername: host, rejectUnauthorized: false, timeout: 15_000 }, () => {
      const cert = socket.getPeerCertificate();
      resolve({
        authorized: socket.authorized,
        error: socket.authorizationError ? String(socket.authorizationError) : undefined,
        subject: asString(cert.subject?.CN),
        altNames: cert.subjectaltname,
        validTo: cert.valid_to,
      });
      socket.end();
    });
    socket.on("error", (e) => resolve({ authorized: false, error: e.message }));
    socket.on("timeout", () => {
      socket.destroy();
      resolve({ authorized: false, error: "timeout" });
    });
  });
}
