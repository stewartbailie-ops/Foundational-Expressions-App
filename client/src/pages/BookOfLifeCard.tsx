import { useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";

type BolData = {
  clientName: string;
  bloodType?: string;
  allergies?: string;
  medicalAidScheme?: string;
  ec1Name?: string;
  ec1Phone?: string;
  gpPhone?: string;
};

export default function BookOfLifeCard() {
  const params = useParams<{ token: string }>();
  const bolUrl = `${window.location.origin}/bol/${params.token}`;

  const { data, isLoading } = useQuery<BolData>({
    queryKey: [`/api/bol/${params.token}`],
    retry: false,
  });

  useEffect(() => {
    if (data) {
      document.title = `Book of Life — ${data.clientName}`;
      // Small delay so QR renders before print dialog opens
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
  }, [data]);

  if (isLoading || !data) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif", color: "#64748b" }}>
        Preparing card…
      </div>
    );
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f1f5f9; font-family: 'Inter', Arial, sans-serif; }

        .page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          gap: 24px;
          flex-wrap: wrap;
          padding: 32px;
        }

        /* Credit-card dimensions: 85.6 × 54mm */
        .card {
          width: 85.6mm;
          height: 54mm;
          border-radius: 4mm;
          background: #0f172a;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(0,0,0,0.2);
          page-break-inside: avoid;
        }

        .card-header {
          background: #dc2626;
          padding: 3mm 4mm 2mm;
          display: flex;
          align-items: center;
          gap: 2mm;
        }

        .card-header-heart {
          width: 5mm;
          height: 5mm;
          color: white;
          fill: white;
        }

        .card-header-text {
          color: white;
          font-size: 6.5pt;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .card-body {
          flex: 1;
          display: flex;
          gap: 3mm;
          padding: 3mm 4mm;
          align-items: center;
        }

        .card-qr {
          background: white;
          padding: 1.5mm;
          border-radius: 2mm;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 1.5mm;
        }

        .card-name {
          color: white;
          font-size: 8pt;
          font-weight: 700;
          line-height: 1.2;
          white-space: normal;
          word-break: break-word;
        }

        .card-sub {
          color: rgba(255,255,255,0.5);
          font-size: 5.5pt;
          line-height: 1.3;
        }

        .card-badge {
          display: inline-block;
          background: #dc262633;
          border: 1px solid #dc262666;
          color: #fca5a5;
          font-size: 5pt;
          font-weight: 700;
          padding: 0.8mm 1.5mm;
          border-radius: 1mm;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 1mm;
        }

        .card-footer {
          padding: 1.5mm 4mm;
          border-top: 1px solid rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .card-url {
          color: rgba(255,255,255,0.3);
          font-size: 4.5pt;
          font-family: monospace;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 55mm;
        }

        .card-brand {
          color: rgba(255,255,255,0.4);
          font-size: 5pt;
          font-weight: 600;
          flex-shrink: 0;
        }

        /* Instructions card */
        .instructions {
          width: 85.6mm;
          background: white;
          border-radius: 4mm;
          padding: 5mm;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          page-break-inside: avoid;
        }

        .instructions h3 {
          font-size: 8pt;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 3mm;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .instructions ol {
          padding-left: 4mm;
          color: #475569;
          font-size: 6.5pt;
          line-height: 1.6;
        }

        .instructions .nfc-note {
          margin-top: 3mm;
          padding: 2mm 3mm;
          background: #fef3c7;
          border-radius: 2mm;
          font-size: 6pt;
          color: #92400e;
        }

        @media print {
          body { background: white; }
          .page { padding: 8mm; gap: 6mm; }
          .card, .instructions { box-shadow: none; }
          @page { margin: 0; size: A4; }
        }

        @media screen {
          .no-print-hint {
            text-align: center;
            color: #64748b;
            font-size: 13px;
            font-family: sans-serif;
            margin-top: 16px;
          }
        }
        @media print {
          .no-print-hint { display: none; }
        }
      `}</style>

      <div className="page">
        {/* Front card */}
        <div className="card">
          <div className="card-header">
            <svg className="card-header-heart" viewBox="0 0 24 24">
              <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/>
            </svg>
            <span className="card-header-text">Advisory Connect — Book of Life</span>
          </div>

          <div className="card-body">
            <div className="card-qr">
              <QRCodeSVG value={bolUrl} size={100} bgColor="#ffffff" fgColor="#0f172a" level="M" />
            </div>
            <div className="card-info">
              <div className="card-name">{data.clientName}</div>
              {data.bloodType && (
                <div style={{ color: "#fca5a5", fontSize: "7pt", fontWeight: 700 }}>
                  Blood: {data.bloodType}
                </div>
              )}
              {data.ec1Name && data.ec1Phone && (
                <div className="card-sub">ICE: {data.ec1Name} · {data.ec1Phone}</div>
              )}
              {data.medicalAidScheme && (
                <div className="card-sub">Aid: {data.medicalAidScheme}</div>
              )}
              <div className="card-badge">Scan in emergency</div>
            </div>
          </div>

          <div className="card-footer">
            <span className="card-url">{bolUrl}</span>
            <span className="card-brand">AC</span>
          </div>
        </div>

        {/* Instructions card */}
        <div className="instructions">
          <h3>How to use this card</h3>
          <ol>
            <li>Keep this card in your wallet at all times</li>
            <li>In an emergency, first responders scan the QR code</li>
            <li>Your full emergency profile opens instantly — no app needed</li>
            <li>Your advisor keeps all information up to date</li>
          </ol>
          <div className="nfc-note">
            <strong>NFC upgrade:</strong> Ask your advisor about an NFC sticker (~R10). Tap any Android phone to it — no camera needed, works from the lock screen.
          </div>
        </div>
      </div>

      <p className="no-print-hint">Press Ctrl+P (or Cmd+P on Mac) to print · Cut along the card edges</p>
    </>
  );
}
