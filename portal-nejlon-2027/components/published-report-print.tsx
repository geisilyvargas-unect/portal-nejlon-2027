'use client';
export function PublishedReportPrint({url}:{url:string}){return <div className="action-row no-print"><button type="button" className="button outline" onClick={()=>navigator.clipboard.writeText(window.location.origin+url)}>Copiar link permanente</button><button type="button" className="button outline" onClick={()=>window.print()}>Imprimir / Salvar PDF</button></div>;}
