"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  LayoutDashboard,
  Plus,
  DollarSign,
  Calculator,
  Database,
  BarChart3,
  ShieldCheck,
  TrendingUp,
  Users,
  FileText
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const cardVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 }
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null)
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, activitiesRes] = await Promise.all([
          fetch('/api/admin/dashboard-stats'),
          fetch('/api/admin/recent-activity')
        ])

        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData)
        }

        if (activitiesRes.ok) {
          const activitiesData = await activitiesRes.json()
          setActivities(activitiesData.activities || [])
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const quickStats = stats ? [
    {
      title: "Active Products",
      value: stats.totalProducts?.toLocaleString() || "0",
      change: "+4.6%",
      icon: LayoutDashboard,
      trend: "up",
      description: "Across indoor and outdoor catalog"
    },
    {
      title: "Pending Enquiries",
      value: stats.pendingEnquiries || "0",
      change: "-12%",
      icon: Users,
      trend: "down",
      description: "Awaiting follow-up"
    },
    {
      title: "Unpriced Products",
      value: stats.unpricedProducts || "0",
      change: "Stable",
      icon: DollarSign,
      trend: "neutral",
      description: "Need price assignment"
    },
    {
      title: "Recent Updates",
      value: stats.recentUpdates || "0",
      change: "+2 new",
      icon: FileText,
      trend: "up",
      description: "Changes in last 7 days"
    }
  ] : []

  const navigationCards = [
    {
      title: "Data Entry",
      description: "Add new lighting products to catalog",
      href: "/admin-dashboard/data-entry",
      icon: Plus,
      accent: "from-blue-500/20 via-sky-500/10 to-indigo-500/20"
    },
    {
      title: "Price Entry",
      description: "Set prices for products without pricing",
      href: "/admin-dashboard/price-entry",
      icon: DollarSign,
      accent: "from-emerald-500/20 via-green-500/10 to-lime-500/20"
    },
    {
      title: "Price Variation",
      description: "Bulk price setup with custom variations",
      href: "/admin-dashboard/price-variation",
      icon: Calculator,
      accent: "from-purple-500/20 via-fuchsia-500/10 to-pink-500/20"
    },
    {
      title: "Data Management",
      description: "Manage product data with Excel-like interface",
      href: "/admin-dashboard/data-management",
      icon: Database,
      accent: "from-amber-500/20 via-orange-500/10 to-red-500/20"
    },
    {
      title: "Enquiry Management",
      description: "Coming soon",
      href: "/admin-dashboard/enquiry-management",
      icon: BarChart3,
      accent: "from-teal-500/20 via-cyan-500/10 to-blue-500/20",
      disabled: true
    },
    {
      title: "Manage Customers",
      description: "Coming soon",
      href: "/admin-dashboard/manage-customers",
      icon: Users,
      accent: "from-rose-500/20 via-pink-500/10 to-fuchsia-500/20",
      disabled: true
    }
  ]

  const recentActivity = activities.length > 0 ? activities.map(activity => ({
    title: activity.title,
    timestamp: activity.timestamp,
    details: activity.details,
    status: activity.status
  })) : []

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-purple-900/10 via-indigo-900/5 to-blue-900/10 dark:from-purple-950/60 dark:via-indigo-950/50 dark:to-blue-950/60">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] dark:opacity-[0.08]">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="admin-grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="currentColor" strokeWidth="0.8" />
            </pattern>
            <radialGradient id="admin-radial" cx="50%" cy="50%" r="75%">
              <stop offset="0%" stopColor="rgba(80, 102, 255, 0.35)" />
              <stop offset="100%" stopColor="rgba(80, 102, 255, 0)" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#admin-grid)" />
          <rect width="100%" height="100%" fill="url(#admin-radial)" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-indigo-900/80 to-slate-900/70 p-10 shadow-xl ring-1 ring-white/10"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(79,70,229,0.4),_transparent_55%)]" />
          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="space-y-4 text-white">
              <Badge variant="secondary" className="bg-white/10 text-white">
                Secured Admin Hub
              </Badge>
              <div className="flex items-center gap-3 text-3xl font-semibold lg:text-4xl">
                <LayoutDashboard className="h-9 w-9" />
                Welcome back, Administrator
              </div>
              <p className="max-w-2xl text-base text-white/80 lg:text-lg">
                Manage your entire lighting catalog, pricing workflows, and enquiry lifecycle from a single, unified dashboard. All tools are authenticated and protected for admin access only.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
                  <Link href="/admin-dashboard/data-entry">Quick Add Product</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-white/40 text-white hover:bg-white/10">
                  <Link href="/admin-dashboard/data-management">Open Data Management</Link>
                </Button>
              </div>
            </div>
            <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-white">
              <div className="flex items-center justify-between">
                <span className="text-sm uppercase tracking-wide text-white/60">System Health</span>
                <ShieldCheck className="h-5 w-5 text-emerald-300" />
              </div>
              <div className="flex items-center gap-3">
                <div className="text-4xl font-semibold">99.9%</div>
                <Badge className="bg-emerald-500/20 text-emerald-200">
                  Verified
                </Badge>
              </div>
              <p className="text-sm text-white/70">All admin services operational with secure Supabase connections.</p>
            </div>
          </div>
        </motion.section>

        {/* Quick Stats */}
        {stats && quickStats.length > 0 && (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {quickStats.map((stat, index) => (
              <motion.div
                key={stat.title}
                variants={cardVariants}
                initial="initial"
                animate="animate"
                transition={{ duration: 0.35, delay: index * 0.05 }}
              >
                <Card className="border border-border/50 bg-background/60 backdrop-blur">
                  <CardHeader className="space-y-1">
                    <CardTitle className="text-base font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-semibold text-foreground">{stat.value}</span>
                      <stat.icon className="h-8 w-8 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{stat.description}</span>
                    <Badge variant="outline" className="border-primary/30 text-primary">
                      {stat.change}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </section>
        )}

        {/* Navigation Cards */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Admin Tools</h2>
              <p className="text-sm text-muted-foreground">Navigate to any admin workflow from the cards below</p>
            </div>
            <Button asChild variant="outline" className="hidden md:flex">
              <Link href="/admin-dashboard/data-management">
                View Detailed Reports
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {navigationCards.map((card, index) => (
              <motion.div
                key={card.title}
                variants={cardVariants}
                initial="initial"
                animate="animate"
                transition={{ duration: 0.35, delay: 0.1 + index * 0.07 }}
              >
                {card.disabled ? (
                  <div className="group block h-full cursor-not-allowed">
                    <Card className="relative h-full overflow-hidden border border-border/60 bg-background/60 opacity-70">
                      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.accent} opacity-0`} />
                      <CardHeader className="relative flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-xl">
                            <card.icon className="h-6 w-6" />
                            {card.title}
                          </CardTitle>
                          <Badge variant="secondary" className="bg-white/20 text-xs text-white">
                            Coming Soon
                          </Badge>
                        </div>
                        <CardDescription className="text-sm text-muted-foreground">
                          {card.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="relative flex items-center justify-between text-sm text-muted-foreground">
                        <span>Coming soon</span>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Link href={card.href} className="group block h-full">
                    <Card className="relative h-full overflow-hidden border border-border/60 bg-background/70 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
                      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.accent} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
                      <CardHeader className="relative flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-xl">
                            <card.icon className="h-6 w-6" />
                            {card.title}
                          </CardTitle>
                          <Badge variant="secondary" className="bg-white/20 text-xs text-white">
                            Protected
                          </Badge>
                        </div>
                        <CardDescription className="text-sm text-muted-foreground">
                          {card.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="relative flex items-center justify-between text-sm text-muted-foreground">
                        <span>Enter workflow</span>
                        <motion.span
                          initial={{ x: 0 }}
                          whileHover={{ x: 4 }}
                          className="text-primary"
                        >
                          →
                        </motion.span>
                      </CardContent>
                    </Card>
                  </Link>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        {activities.length > 0 && (
          <section className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
            <motion.div
              variants={cardVariants}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.35, delay: 0.2 }}
            >
              <Card className="border border-border/50 bg-background/70">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                  <CardDescription>Live view of catalog and enquiry actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.title} className="rounded-xl border border-border/40 bg-background/60 p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">{activity.title}</h3>
                        <Badge variant="outline" className="border-border/60 text-xs text-muted-foreground">
                          {activity.timestamp}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{activity.details}</p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[11px] uppercase tracking-wide">
                          <TrendingUp className="h-3 w-3" />
                          {activity.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              variants={cardVariants}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.35, delay: 0.25 }}
            >
              <Card className="h-full border border-border/50 bg-background/70">
                <CardHeader>
                  <CardTitle className="text-lg">Admin Notes</CardTitle>
                  <CardDescription>Stay aligned with latest changes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="rounded-lg border border-border/40 bg-background/60 p-4">
                    <h4 className="font-medium text-foreground">Price Verification</h4>
                    <p className="mt-1 text-sm">Ensure all newly added indoor products include regional price variants before publishing.</p>
                  </div>
                  <div className="rounded-lg border border-border/40 bg-background/60 p-4">
                    <h4 className="font-medium text-foreground">Compliance Update</h4>
                    <p className="mt-1 text-sm">Upload the latest CE and UL certification documents for new outdoor fixtures.</p>
                  </div>
                  <div className="rounded-lg border border-border/40 bg-background/60 p-4">
                    <h4 className="font-medium text-foreground">Upcoming Release</h4>
                    <p className="mt-1 text-sm">Variation templates for archived products will be available in the next sprint.</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </section>
        )}
      </div>
    </div>
  )
}
