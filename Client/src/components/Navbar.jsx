import React from "react"
import { Button } from "./ui/button"
import { Menu, Plane } from "lucide-react"
import { Link } from "react-router-dom"

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Logo + Links */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md">
                <Plane className="h-5 w-5 text-white" />
              </div>
              <span className="text-slate-900 font-semibold text-lg tracking-tight">TripCraft</span>
            </div>

            {/* Nav Links (hidden on mobile) */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-slate-600 hover:text-slate-900 transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-slate-600 hover:text-slate-900 transition-colors">
                How It Works
              </a>
              <a href="#sample" className="text-slate-600 hover:text-slate-900 transition-colors">
                Sample Itinerary
              </a>
              <a href="#testimonials" className="text-slate-600 hover:text-slate-900 transition-colors">
                Reviews
              </a>
            </div>
          </div>

          {/* Right: Buttons */}
          <div className="flex items-center gap-3">
            <Link to='/SignIn'>
              <Button variant="ghost" className="hidden sm:inline-flex">
                Sign In
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button>
                Start Planning
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5 text-slate-700" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
