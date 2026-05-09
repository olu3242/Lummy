"use client"

import { motion } from "framer-motion"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { mockFAQItems } from "@/data/mock"

export function FAQSection() {
  return (
    <section id="faq" className="section-padding bg-background">
      <div className="container">
        <div className="flex flex-col lg:flex-row gap-16 items-start">
          {/* Left: Header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="flex-1 lg:sticky lg:top-28"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">
              FAQs
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
              Got questions?
              <br />
              <span className="gradient-text">We have answers.</span>
            </h2>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-sm">
              Everything you need to know about selling on Lummy. Can&apos;t find your answer?
            </p>
            <button className="mt-4 text-sm text-primary font-semibold hover:underline">
              Chat with our team →
            </button>
          </motion.div>

          {/* Right: Accordion */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex-1 w-full"
          >
            <Accordion type="single" collapsible className="divide-y divide-border">
              {mockFAQItems.map((item) => (
                <AccordionItem key={item.id} value={item.id} className="border-0">
                  <AccordionTrigger className="text-left text-base font-semibold hover:no-underline py-5">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-base pb-5">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
