'use client';

import React, { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface TicketPrintProps {
  ticketData: any;
  printConfig: any;
  entity: any;
}

export const TicketPrintLayout = forwardRef<HTMLDivElement, TicketPrintProps>(
  ({ ticketData, printConfig, entity }, ref) => {
    if (!ticketData) return null;

    const width = printConfig?.paper_size === '80mm' ? '80mm' : '58mm';

    return (
      <div className="hidden print:block">
        <div
          ref={ref}
          style={{
            width,
            padding: '12px',
            backgroundColor: 'white',
            color: 'black',
            fontFamily: 'monospace',
            textAlign: 'center',
            fontSize: '12px',
          }}
        >
          {printConfig?.show_logo && entity?.logo_url && (
            <img
              src={entity.logo_url}
              alt="Logo"
              style={{ width: '100%', maxWidth: '120px', margin: '0 auto 8px', display: 'block' }}
            />
          )}

          <h2 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 4px' }}>
            {printConfig?.header_message || entity?.name}
          </h2>

          <div
            style={{
              padding: '10px 0',
              borderTop: '1px dashed #000',
              borderBottom: '1px dashed #000',
              margin: '8px 0',
            }}
          >
            <p style={{ margin: '0', fontSize: '11px', textTransform: 'uppercase' }}>
              Turno Asignado
            </p>
            <h1 style={{ fontSize: '40px', fontWeight: 'bold', margin: '4px 0', letterSpacing: '2px' }}>
              {ticketData.ticket_code}
            </h1>
            <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>
              {ticketData.service?.name}
            </p>
          </div>

          <p style={{ margin: '4px 0', fontSize: '11px' }}>
            Prioridad: {ticketData.priority?.name}
          </p>
          <p style={{ margin: '4px 0', fontSize: '11px' }}>
            Fecha: {new Date(ticketData.created_at).toLocaleString('es-CO')}
          </p>
          <p style={{ margin: '4px 0', fontSize: '11px' }}>
            Turnos en espera: {ticketData.waitingCount ?? 0}
          </p>

          {printConfig?.show_qr && (
            <div style={{ margin: '12px auto', display: 'flex', justifyContent: 'center' }}>
              <QRCodeSVG
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/estado/${ticketData.id}`}
                size={100}
              />
            </div>
          )}

          {printConfig?.footer_message && (
            <p style={{ marginTop: '10px', fontSize: '11px', whiteSpace: 'pre-line' }}>
              {printConfig.footer_message}
            </p>
          )}
        </div>
      </div>
    );
  }
);

TicketPrintLayout.displayName = 'TicketPrintLayout';
