import EventCard from "@/components/EventCard"
import ExploreBtn from "@/components/ExploreBtn"
import { EventItem, staticEvents } from "@/lib/constants"
import { getAllEvents } from "@/lib/actions/event.action"
import { Event } from "@/types/event.types"

// Revalidate every hour (3600 seconds) - adjust based on how often events change
export const revalidate = 3600;

const Page = async () => {
  // Fetch events directly from database using server action
  const events: Event[] = await getAllEvents();

  return (
    <section>
      <h1 className="text-center">The Hub for Every Dev <br /> Event You Can't Miss</h1>
      <p className="text-center mt-5">Hackathons, Meetups, and Conferences, All in One Place</p>

      <ExploreBtn />

      <div className="mt-20 space-y-7">
        <ul className="events" id="events">
          {(events.length > 0 ? events : staticEvents).map((event: EventItem) => (
            <li key={event.title} className="list-none">
              <EventCard {...event} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default Page