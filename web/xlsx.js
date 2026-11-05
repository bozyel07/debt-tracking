// Small .xlsx writer with no outside libraries.
// styles: 0 text, 1 header, 2 money, 3 date, 4 red text, 5 red money, 6 red date, 7 bold, 8 bold money
window.DT_XLSX = (function(){
  const enc = new TextEncoder();
  const table = Array.from({length:256},(_, n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;return c>>>0;});
  const crc32 = b => {let c=-1;for(let i=0;i<b.length;i++)c=table[(c^b[i])&255]^(c>>>8);return (c^-1)>>>0;};
  const x = s => String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,'');
  const col = i => {let s='';i++;while(i>0){const m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=(i-m-1)/26;}return s;};
  const serial = d => {const [y,m,day]=d.split('-').map(Number);return Math.round((Date.UTC(y,m-1,day)-Date.UTC(1899,11,30))/864e5);};
  function zip(files){
    const parts=[],central=[];let off=0;
    const u16=n=>[n&255,n>>8&255],u32=n=>[n&255,n>>8&255,n>>16&255,n>>>24&255];
    for(const [name,text] of files){
      const nm=enc.encode(name),d=enc.encode(text),crc=crc32(d);
      const common=[...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(33),...u32(crc),...u32(d.length),...u32(d.length),...u16(nm.length),...u16(0)];
      const head=new Uint8Array([0x50,0x4b,3,4,...common]);
      parts.push(head,nm,d);
      central.push({bytes:new Uint8Array([0x50,0x4b,1,2,...u16(20),...common,...u16(0),...u16(0),...u16(0),...u32(0),...u32(off)]),nm});
      off+=head.length+nm.length+d.length;
    }
    let size=0;const start=off;
    for(const c of central){parts.push(c.bytes,c.nm);size+=c.bytes.length+c.nm.length;}
    parts.push(new Uint8Array([0x50,0x4b,5,6,0,0,0,0,...u16(central.length),...u16(central.length),...u32(size),...u32(start),0,0]));
    return new Blob(parts,{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  }
  function sheetXml(sh){
    const cols=(sh.widths||[]).map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('');
    const rows=sh.rows.map((r,ri)=>{
      const cells=r.map((c,ci)=>{
        if(c==null||c==='')return'';
        const o=typeof c==='object'?c:{v:c};const ref=col(ci)+(ri+1);let s=o.s||0;
        if(o.date)return `<c r="${ref}" s="${s||3}"><v>${serial(o.v)}</v></c>`;
        if(typeof o.v==='number')return `<c r="${ref}" s="${s||2}"><v>${o.v}</v></c>`;
        return `<c r="${ref}" s="${s}" t="inlineStr"><is><t xml:space="preserve">${x(o.v)}</t></is></c>`;
      }).join('');
      return `<row r="${ri+1}">${cells}</row>`;}).join('');
    const pane=sh.freeze?`<sheetViews><sheetView workbookViewId="0"><pane ySplit="${sh.freeze}" topLeftCell="A${sh.freeze+1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>`:'';
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${pane}${cols?`<cols>${cols}</cols>`:''}<sheetData>${rows}</sheetData></worksheet>`;
  }
  const styles=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="2"><numFmt numFmtId="164" formatCode="#,##0.00"/><numFmt numFmtId="165" formatCode="dd\\.mm\\.yyyy"/></numFmts><fonts count="4"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><sz val="11"/><color rgb="FFD21F2B"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF134A63"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="9"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="164" fontId="2" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/><xf numFmtId="165" fontId="2" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/><xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="164" fontId="3" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  function build(sheets){
    const safe=sheets.map((s,i)=>({...s,name:String(s.name).replace(/[\\\/\?\*\[\]:]/g,' ').slice(0,31)||('Sheet'+(i+1))}));
    return zip([
      ['[Content_Types].xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${safe.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`],
      ['_rels/.rels',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
      ['xl/workbook.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${safe.map((s,i)=>`<sheet name="${x(s.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets></workbook>`],
      ['xl/_rels/workbook.xml.rels',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${safe.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}<Relationship Id="rId${safe.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
      ['xl/styles.xml',styles],
      ...safe.map((s,i)=>[`xl/worksheets/sheet${i+1}.xml`,sheetXml(s)])
    ]);
  }
  return {build};
})();
