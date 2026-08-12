import Script from 'next/script'

/**
 * Microsoft Clarity — heatmaps + session replays + rage-click
 * detection. Loads only when NEXT_PUBLIC_CLARITY_ID is set, so
 * local dev doesn't ship the tag and previews don't pollute the
 * production dashboard.
 *
 * Uses Next's Script with `afterInteractive` so it never blocks
 * first paint or interaction. Clarity's script itself is <5KB
 * and lazy-loads its own bundle.
 */
export function Clarity() {
  const id = process.env.NEXT_PUBLIC_CLARITY_ID
  if (!id) return null

  const snippet = `
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", ${JSON.stringify(id)});
  `

  return (
    <Script id="ms-clarity" strategy="afterInteractive">
      {snippet}
    </Script>
  )
}
