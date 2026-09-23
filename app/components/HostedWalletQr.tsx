"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

// QR of a browser wallet's hosted instance, shown beside the open-the-wallet
// link wherever a wallet with nothing to install is offered (wwWallet and
// wallets built on it): scanning it opens the wallet on the phone so the
// account is created there, while the link keeps the same-device path.
export default function HostedWalletQr({
  url,
  caption,
}: {
  url: string;
  caption: string;
}) {
  const [qr, setQr] = useState<string | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(url, { width: 132, margin: 1 })
      .then((data) => {
        if (alive) setQr(data);
      })
      .catch(() => {
        // no QR, the link alone still works
      });
    return () => {
      alive = false;
    };
  }, [url]);
  if (!qr) return null;
  return (
    <div className="flex items-center gap-4">
      {/* eslint-disable-next-line @next/next/no-img-element -- generated data: URI, not a static asset next/image can optimize */}
      <img
        src={qr}
        alt={caption}
        className="h-[108px] w-[108px] rounded-xl border border-gray-200 bg-white p-1.5"
      />
      <p className="max-w-[220px] text-xs leading-relaxed text-gray-500">
        {caption}
      </p>
    </div>
  );
}
