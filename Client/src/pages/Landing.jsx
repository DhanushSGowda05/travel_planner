import React from 'react'
import { Features } from "../components/Features"
import { Hero } from "../components/Hero"
import { HowItWorks } from "../components/HowItWorks"
import { Navbar } from "../components/Navbar"
import { SampleItinerary } from "../components/SampleItinerary"
import { Testimonials } from "../components/Testimonials"
import { Footer } from '../components/Footer'

const Landing = () => {
  return (
      <>
        <Navbar />
        <main>
          <Hero/>
          <Features/>
          <HowItWorks/>
          <SampleItinerary/>
          <Testimonials/>
        </main>
        <Footer/>
      </>
    )
}

export default Landing