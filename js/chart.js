export function drawTemperatureChart(canvas, labels, values, unit, dark=false) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(300, rect.width) * dpr;
  canvas.height = Math.max(200, rect.height) * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  const w = rect.width, h = rect.height;
  const pad = {l:34,r:16,t:20,b:32};
  const min = Math.min(...values) - 2, max = Math.max(...values) + 2;
  const x = i => pad.l + i * (w-pad.l-pad.r) / Math.max(1,values.length-1);
  const y = v => pad.t + (max-v) * (h-pad.t-pad.b)/(max-min);
  const text = dark ? "#9aaabd" : "#6c7b8e";
  const line = dark ? "#27384c" : "#dfe8f1";
  const accent = dark ? "#63a0ff" : "#2f7df4";

  ctx.font = "11px Inter, sans-serif";
  ctx.lineWidth = 1;
  ctx.strokeStyle = line;
  for (let i=0;i<4;i++) {
    const yy=pad.t+i*(h-pad.t-pad.b)/3;
    ctx.beginPath(); ctx.moveTo(pad.l,yy); ctx.lineTo(w-pad.r,yy); ctx.stroke();
    ctx.fillStyle=text; ctx.fillText(`${Math.round(max-i*(max-min)/3)}°`,2,yy+4);
  }
  const grad=ctx.createLinearGradient(0,pad.t,0,h);
  grad.addColorStop(0,"rgba(47,125,244,.20)"); grad.addColorStop(1,"rgba(47,125,244,0)");
  ctx.beginPath(); values.forEach((v,i)=>i?ctx.lineTo(x(i),y(v)):ctx.moveTo(x(i),y(v)));
  ctx.lineTo(x(values.length-1),h-pad.b); ctx.lineTo(x(0),h-pad.b); ctx.closePath(); ctx.fillStyle=grad; ctx.fill();
  ctx.beginPath(); values.forEach((v,i)=>i?ctx.lineTo(x(i),y(v)):ctx.moveTo(x(i),y(v)));
  ctx.strokeStyle=accent; ctx.lineWidth=3; ctx.lineJoin="round"; ctx.stroke();
  values.forEach((v,i)=>{
    ctx.beginPath(); ctx.arc(x(i),y(v),3.2,0,Math.PI*2); ctx.fillStyle=accent; ctx.fill();
  });
  ctx.fillStyle=text; ctx.font="10px Inter, sans-serif";
  labels.forEach((label,i)=>{ if(i%3===0) ctx.fillText(label,x(i)-10,h-10); });
}
