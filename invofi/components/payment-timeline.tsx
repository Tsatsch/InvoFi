"use client"

import { useEffect, useState } from "react"
import { CheckCircle, Clock, ArrowRight } from "lucide-react"

interface TimelineEvent {
  id: string
  date: string
  title: string
  description: string
  status: "completed" | "pending" | "upcoming"
}

interface PaymentTimelineProps {
  invoiceId: string
  status: string
}

export function PaymentTimeline({ invoiceId, status }: PaymentTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // In a real app, this would be an API call
    const fetchTimeline = async () => {
      setIsLoading(true)
      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800))

        // Mock timeline data
        const mockEvents: TimelineEvent[] = [
          {
            id: "event_1",
            date: "2025-04-15 09:23",
            title: "Invoice Created",
            description: "Invoice was generated and saved to the system",
            status: "completed",
          },
          {
            id: "event_2",
            date: "2025-04-15 14:45",
            title: "Tokenization Initiated",
            description: "Invoice tokenization process started",
            status: "completed",
          },
          {
            id: "event_3",
            date: "2025-04-16 10:12",
            title: "Counterparty Approval",
            description: "Invoice was approved by the counterparty",
            status: "completed",
          },
          {
            id: "event_4",
            date: "2025-04-16 15:30",
            title: "Invoice Tokenized",
            description: "Invoice successfully tokenized on blockchain",
            status: "completed",
          },
        ]

        // Add payment events based on status
        if (status === "paid") {
          mockEvents.push(
            {
              id: "event_5",
              date: "2025-04-20 11:05",
              title: "Partial Payment Received",
              description: "50% of invoice amount received",
              status: "completed",
            },
            {
              id: "event_6",
              date: "2025-05-10 09:17",
              title: "Final Payment Received",
              description: "Remaining invoice amount received",
              status: "completed",
            },
          )
        } else {
          mockEvents.push({
            id: "event_5",
            date: "Pending",
            title: "Payment Pending",
            description: "Waiting for payment from client",
            status: "pending",
          })
        }

        setEvents(mockEvents)
      } catch (error) {
        console.error("Failed to fetch timeline:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTimeline()
  }, [invoiceId, status])

  if (isLoading) {
    return <p>Loading timeline...</p>
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        {events.map((event, index) => (
          <div key={event.id} className="mb-8 flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`rounded-full p-1 ${
                  event.status === "completed"
                    ? "bg-primary text-primary-foreground"
                    : event.status === "pending"
                      ? "bg-yellow-500 text-white"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {event.status === "completed" ? (
                  <CheckCircle className="h-5 w-5" />
                ) : event.status === "pending" ? (
                  <Clock className="h-5 w-5" />
                ) : (
                  <ArrowRight className="h-5 w-5" />
                )}
              </div>
              {index < events.length - 1 && <div className="h-full w-px bg-border mt-1 mb-1" />}
            </div>
            <div className="pb-2">
              <p className="text-sm text-muted-foreground">{event.date}</p>
              <h4 className="font-medium">{event.title}</h4>
              <p className="text-sm text-muted-foreground">{event.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
