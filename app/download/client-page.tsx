'use client'

import Link from 'next/link'
import { useEffect } from 'react'

type DownloadPageProps = {
  data: {
    orderNumber: string
    downloads: Array<{
      asset_type: string
      url: string
      label: string
    }>
    previewImageUrl?: string | null
  } | null
}

export function DownloadPageClient({ data }: DownloadPageProps) {
  // Auto-download when page loads
  useEffect(() => {
    if (data?.downloads?.[0]?.url) {
      const timer = setTimeout(() => {
        // Open download in new tab to keep success page visible
        window.open(data.downloads[0].url, '_blank')
      }, 1000) // 1 second delay to show the UI first
      
      return () => clearTimeout(timer)
    }
  }, [data])

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-card border border-border rounded-xl shadow-xl p-8">
            <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="font-heading text-xl font-semibold text-foreground mb-4">
              Invalid or expired link
            </h1>
            <p className="text-muted-foreground mb-8">
              This download link is invalid or has expired. You can request a new link using your
              order number and email.
            </p>
            <Link 
              href="/order-lookup" 
              className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Get a new download link
            </Link>
            <p className="mt-6">
              <Link 
                href="/" 
                className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                Back to home
              </Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-32 h-32 mb-6 relative">
            {data.previewImageUrl ? (
              <div className="w-full h-full rounded-full overflow-hidden border-4 border-green-400 shadow-xl">
                <img
                  src={data.previewImageUrl}
                  alt="Your portrait"
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                <svg
                  className="w-16 h-16 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            )}
            {/* Success checkmark overlay */}
            <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center border-4 border-background shadow-lg">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <h1 className="font-heading text-4xl font-bold text-foreground mb-3">
            Your Portrait is Ready!
          </h1>
          <p className="text-lg text-muted-foreground">
            Order <strong className="text-foreground">{data.orderNumber}</strong>
          </p>
        </div>

        {/* Download Card */}
        <div className="bg-card/80 backdrop-blur border border-border/50 rounded-2xl shadow-2xl p-8 mb-8">
          {/* Auto-download Status */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full shrink-0"></div>
              <div>
                <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Download starting automatically...
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-200">
                  Your high-resolution portrait will download in a moment
                </p>
              </div>
            </div>
          </div>

          {/* Manual Download Button */}
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {data.downloads[0].label}
            </h2>
            <p className="text-muted-foreground mb-6">
              High-resolution PNG ready for printing and sharing
            </p>
            
            <a
              href={data.downloads[0].url}
              target="_blank"
              rel="noopener noreferrer"
              download={`portrait-${data.orderNumber}.png`}
              className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download Portrait
            </a>
          </div>
        </div>

        {/* Footer Links */}
        <div className="text-center space-y-6">
          <p className="text-sm text-muted-foreground">
            <span className="inline-block w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
            Download link expires in 1 hour
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/order-lookup" 
              className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
            >
              Lost your link? Get a new one
            </Link>
            <Link 
              href="/" 
              className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}