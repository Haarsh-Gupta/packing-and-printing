// REMOVE THIS:
<div dangerouslySetInnerHTML={{ __html: form.message }} />

// REPLACE WITH:
// 1. npm install dompurify @types/dompurify
// 2. import DOMPurify from "dompurify";
// 3. Use a sandboxed iframe:
<iframe
  ref={iframeRef}
  title="Email preview"
  sandbox="allow-same-origin"  // no allow-scripts — scripts cannot run
  style={{ width: "100%", minHeight: 300, border: "1px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)" }}
/>

// And write to it via useEffect:
useEffect(() => {
  if (!preview || !iframeRef.current) return;
  const clean = DOMPurify.sanitize(form.message, {
    ALLOWED_TAGS: ["p","br","strong","em","u","h1","h2","ul","ol","li","a","table","tr","td"],
    ALLOW_DATA_ATTR: false,
  });
  const doc = iframeRef.current.contentDocument!;
  doc.open();
  doc.write(`<!DOCTYPE html><html><body style="font-family:sans-serif;font-size:14px;padding:16px">${clean}</body></html>`);
  doc.close();
}, [form.message, preview]);