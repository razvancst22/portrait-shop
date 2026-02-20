'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/primitives/card'
import { Button } from '@/components/primitives/button'
import { Badge } from '@/components/primitives/badge'
import { 
  validateThemeAccessibility, 
  THEME_COLORS, 
  type ThemeName, 
  type ColorTest 
} from '@/lib/accessibility'
import { CheckCircle, AlertTriangle, XCircle, Eye } from 'lucide-react'

export function AccessibilityChecker() {
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>('atelier')
  const [showDetails, setShowDetails] = useState(false)

  const themeNames: ThemeName[] = ['atelier', 'monochrome', 'earth', 'professional', 'pastels', 'bold']
  
  const getStatusIcon = (rating: ColorTest['rating']) => {
    switch (rating.color) {
      case 'green':
        return <CheckCircle className="size-4 text-green-600" />
      case 'blue':
        return <CheckCircle className="size-4 text-blue-600" />
      case 'orange':
        return <AlertTriangle className="size-4 text-orange-600" />
      case 'red':
        return <XCircle className="size-4 text-red-600" />
      default:
        return null
    }
  }

  const getStatusColor = (rating: ColorTest['rating']) => {
    switch (rating.color) {
      case 'green': return 'bg-green-100 text-green-800 border-green-200'
      case 'blue': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'orange': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'red': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const themeResults = themeNames.map(themeName => {
    const results = validateThemeAccessibility(THEME_COLORS[themeName])
    const criticalIssues = results.filter(test => test.critical && test.rating.color === 'red').length
    const totalCritical = results.filter(test => test.critical).length
    const passed = results.filter(test => test.critical && test.rating.color !== 'red').length
    
    return {
      name: themeName,
      results,
      criticalIssues,
      totalCritical,
      passed,
      score: totalCritical > 0 ? Math.round((passed / totalCritical) * 100) : 100
    }
  })

  const currentThemeResults = themeResults.find(t => t.name === selectedTheme)?.results || []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="size-5" />
                Accessibility Validation
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                WCAG 2.1 color contrast compliance testing for all themes
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Theme Overview */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {themeResults.map((theme) => (
              <button
                key={theme.name}
                onClick={() => setSelectedTheme(theme.name)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  selectedTheme === theme.name 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium capitalize">{theme.name}</span>
                  {theme.criticalIssues === 0 ? (
                    <CheckCircle className="size-4 text-green-600" />
                  ) : (
                    <XCircle className="size-4 text-red-600" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {theme.score}% compliant
                </div>
                <div className="text-xs text-muted-foreground">
                  {theme.criticalIssues === 0 ? 'No issues' : `${theme.criticalIssues} issues`}
                </div>
              </button>
            ))}
          </div>

          {/* Detailed Results */}
          {showDetails && currentThemeResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground capitalize">
                {selectedTheme} Theme - Detailed Results
              </h3>
              
              <div className="grid gap-4">
                {currentThemeResults.map((test, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(test.rating)}
                      <div>
                        <p className="font-medium text-foreground">{test.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Ratio: {test.ratio.toFixed(2)}:1
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(test.rating)}`}>
                        {test.rating.label}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(test.rating)}`}>
                        {test.rating.level}
                      </span>
                      {test.critical && (
                        <span className="text-xs px-2 py-1 rounded border bg-purple-100 text-purple-800 border-purple-200">
                          Critical
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium text-foreground mb-2">Accessibility Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-green-600">Fully Compliant</p>
                <p className="text-muted-foreground">
                  {themeResults.filter(t => t.criticalIssues === 0).length} of {themeResults.length} themes
                </p>
              </div>
              <div>
                <p className="font-medium text-blue-600">WCAG AA Standard</p>
                <p className="text-muted-foreground">
                  4.5:1 contrast ratio required
                </p>
              </div>
              <div>
                <p className="font-medium text-primary">Testing Coverage</p>
                <p className="text-muted-foreground">
                  {currentThemeResults.length} critical combinations tested
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}